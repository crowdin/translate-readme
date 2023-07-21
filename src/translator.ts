import * as fs from 'fs';
import crowdin from '@crowdin/crowdin-api-client';
import {updateOrCreateFile} from '@crowdin/crowdin-apps-functions';
import {Config, CredentialsConfig} from './config';
import {Logger} from './logger';

export class Translator {
    private credentials: CredentialsConfig;
    private config: Config;
    private logger: Logger;
    private crowdin: crowdin;

    constructor(credentials: CredentialsConfig, config: Config, logger: Logger) {
        this.credentials = credentials;
        this.config = config;
        this.logger = logger;

        this.crowdin = new crowdin({
            token: this.credentials.token,
            organization: this.credentials.organization
        });
    }

    public async translate(): Promise<void> {
        await this.uploadSources();
    }

    private async uploadSources(): Promise<void> {
        await updateOrCreateFile({
            client: this.crowdin,
            projectId: this.credentials.projectId,
            name: this.config.file,
            data: fs.readFileSync(this.config.file)
        });
    }
}
