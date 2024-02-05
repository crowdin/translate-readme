import * as fs from 'fs';
import crowdin, {SourceFilesModel, TranslationsModel} from '@crowdin/crowdin-api-client';
import {Config, CredentialsConfig} from './config';
import {Logger} from './logger';
import BuildRequest = TranslationsModel.BuildRequest;
import {downloadZipAndUnzip} from './utils/zip';
import {baseName} from './utils/path';
import {Writer} from './writer';

export class Translator {
    private credentials: CredentialsConfig;
    private config: Config;
    private logger: Logger;

    private crowdin: crowdin;
    private writer: Writer;

    constructor(credentials: CredentialsConfig, config: Config, logger: Logger) {
        this.credentials = credentials;
        this.config = config;
        this.logger = logger;

        this.crowdin = new crowdin({
            token: this.credentials.token,
            organization: this.credentials.organization
        });

        this.writer = new Writer(credentials, config, logger);
    }

    public async translate(): Promise<void> {
        this.logger.log('info', 'Start...');

        const project = await this.crowdin.projectsGroupsApi.getProject(this.credentials.projectId);
        this.writer.setProjectLanguages(project.data.targetLanguages);

        if (this.config.uploadSources) {
            await this.writer.addLanguageSwitcher(this.config.file);
            await this.uploadSources();
        }

        if (this.config.downloadTranslations) {
            const translationsUrl = await this.downloadTranslations();
            const translationFiles = await downloadZipAndUnzip(translationsUrl, this.config.destination);

            translationFiles.map(async (file: string): Promise<void> => {
                await this.writer.addLanguageSwitcher(`${this.config.destination}/${file}`);
            });
        }

        this.logger.log('info', 'Done!');
    }

    private async uploadSources(): Promise<void> {
        this.logger.log('info', 'Uploading sources...');

        const readmeFile = await this.getFile();
        const exportPattern = '/README.%locale%.md';

        const storageFile = await this.crowdin.uploadStorageApi.addStorage(
            baseName(this.config.file),
            fs.readFileSync(this.config.file)
        );

        let branchId = undefined;

        if (this.config.branch) {
            let branch = await this.getBranch();

            if (!branch) {
                branch = (
                    await this.crowdin.sourceFilesApi.createBranch(this.credentials.projectId, {
                        name: this.config.branch
                    })
                ).data;

                this.logger.log('info', `Branch ${branch.name} successfully created!`);
            }

            branchId = branch.id;
        }

        if (readmeFile) {
            await this.crowdin.sourceFilesApi.updateOrRestoreFile(this.credentials.projectId, readmeFile.id, {
                storageId: storageFile.data.id,
                exportOptions: {
                    exportPattern: exportPattern
                }
            });

            this.logger.log('info', 'Source file successfully updated!');
        } else {
            await this.crowdin.sourceFilesApi.createFile(this.credentials.projectId, {
                storageId: storageFile.data.id,
                name: baseName(this.config.file),
                branchId: branchId,
                exportOptions: {
                    exportPattern: exportPattern
                }
            });

            this.logger.log('info', 'Source file successfully created!');
        }
    }

    private async downloadTranslations(): Promise<string> {
        this.logger.log('info', 'Downloading translations...');

        let request: BuildRequest = {};

        if (this.config.languages) {
            request = {
                targetLanguageIds: this.config.languages
            };
        }

        const result = await this.crowdin.translationsApi.buildProject(this.credentials.projectId, request);
        let status = result.data.status;

        while (status === 'inProgress') {
            const progress = await this.crowdin.translationsApi.checkBuildStatus(
                this.credentials.projectId,
                result.data.id
            );
            status = progress.data.status;
            this.logger.log('info', `Progress: ${progress.data.progress}%`);
        }

        const translations = await this.crowdin.translationsApi.downloadTranslations(
            this.credentials.projectId,
            result.data.id
        );

        this.logger.log('info', 'Translations downloaded!');

        return translations.data.url;
    }

    private async getFile(): Promise<SourceFilesModel.File | undefined> {
        const files = await this.crowdin.sourceFilesApi.listProjectFiles(this.credentials.projectId);

        const sourceFile = files.data.find(file => {
            return file.data.path.toLowerCase() === this.getCrowdinFilePath().toLowerCase();
        });

        return sourceFile?.data;
    }

    private async getBranch(): Promise<SourceFilesModel.Branch | undefined> {
        const branches = await this.crowdin.sourceFilesApi.listProjectBranches(this.credentials.projectId);

        const crowdinBranch = branches.data.find(branch => branch.data.name === this.config.branch);

        return crowdinBranch?.data;
    }

    private getCrowdinFilePath(): string {
        const fileName = baseName(this.config.file);

        if (this.config.branch) {
            return `/${this.config.branch}/${fileName}`;
        } else {
            return `/${fileName}`;
        }
    }
}
