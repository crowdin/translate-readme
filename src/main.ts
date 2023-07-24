import * as core from '@actions/core';
import {Config, CredentialsConfig} from './config';
import {Translator} from './translator';
import {Logger} from './logger';

async function run(): Promise<void> {
    try {
        const config: Config = {
            file: core.getInput('file'),
            branch: core.getInput('branch'),
            destination: core.getInput('destination'),
            languages: core.getMultilineInput('languages'),
            languageSwitcher: core.getBooleanInput('language_switcher'),
            uploadSources: core.getBooleanInput('upload_sources'),
            downloadTranslations: core.getBooleanInput('download_translations')
        };

        let credentialsConfig: CredentialsConfig = {
            projectId: 0,
            token: '',
            organization: ''
        };

        if (process.env.CROWDIN_PROJECT_ID) {
            credentialsConfig.projectId = +process.env.CROWDIN_PROJECT_ID;
        }

        if (process.env.CROWDIN_PERSONAL_TOKEN) {
            credentialsConfig.token = process.env.CROWDIN_PERSONAL_TOKEN;
            core.setSecret(String(credentialsConfig.token));
        }

        if (process.env.CROWDIN_ORGANIZATION) {
            credentialsConfig.organization = process.env.CROWDIN_ORGANIZATION;
            core.setSecret(String(credentialsConfig.organization));
        }

        validateCredentials(credentialsConfig);

        const translator: Translator = new Translator(credentialsConfig, config, new Logger());

        await translator.translate();
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message);
    }
}

function validateCredentials(credentialsConfig: CredentialsConfig): void {
    if (credentialsConfig.projectId && credentialsConfig.token) {
        return;
    }

    let missingVariables: string[] = [];

    if (!credentialsConfig.projectId) {
        missingVariables.push('CROWDIN_PROJECT_ID');
    }

    if (!credentialsConfig.token) {
        missingVariables.push('CROWDIN_PERSONAL_TOKEN');
    }

    throw Error(`Missing environment variable(s): ${missingVariables.join(', ')}`);
}

run();
