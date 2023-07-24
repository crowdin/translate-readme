import fs from 'fs';
import {Logger} from './logger';
import {Config, CredentialsConfig} from './config';
import {LanguagesModel} from '@crowdin/crowdin-api-client';
import {baseName, generateRelativeFileLink, toPlatformPath} from './utils/path';

export class Writer {
    private placeholderStart = '<!-- README-TRANSLATE-LANGUAGES-START -->';
    private placeholderEnd = '<!-- README-TRANSLATE-LANGUAGES-END -->';

    private credentials: CredentialsConfig;
    private config: Config;
    private logger: Logger;

    private projectLanguages: LanguagesModel.Language[] = [];

    constructor(credentials: CredentialsConfig, config: Config, logger: Logger) {
        this.credentials = credentials;
        this.config = config;
        this.logger = logger;
    }

    public setProjectLanguages(projectLanguages: LanguagesModel.Language[]): void {
        this.projectLanguages = projectLanguages;
    }

    public async addLanguageSwitcher(file: string): Promise<void> {
        if (!this.config.languageSwitcher) {
            return;
        }

        this.logger.log('info', `Adding language switcher to ${file}...`);

        let fileContents = fs.readFileSync(toPlatformPath(file)).toString();

        if (!fileContents.includes(this.placeholderStart) || !fileContents.includes(this.placeholderEnd)) {
            this.logger.log(
                'warning',
                `Skipped! Please add ${this.placeholderStart} and ${this.placeholderEnd} to your README.md`
            );

            return;
        }

        const sliceFrom = fileContents.indexOf(this.placeholderStart) + this.placeholderStart.length;
        const sliceTo = fileContents.indexOf(this.placeholderEnd);
        const switcher = await this.renderSwitcher(file);

        fileContents = `${fileContents.slice(0, sliceFrom)}\n${switcher}\n${fileContents.slice(sliceTo)}`;

        this.logger.log('debug', fileContents);

        fs.writeFileSync(toPlatformPath(file), fileContents);
    }

    public async renderSwitcher(file: string): Promise<string> {
        let languages: string[] = [];

        this.projectLanguages.map(language => {
            const link = `${this.config.destination}/README.${language.locale}.md`;

            if (baseName(link) === baseName(file)) {
                languages.push(`**${language.name}**`);
            } else {
                languages.push(`[${language.name}](${generateRelativeFileLink(file, link)})`);
            }
        });

        return languages.join(' | ');
    }
}
