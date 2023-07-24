interface CredentialsConfig {
    projectId: number;
    token: string;
    organization?: string;
}

interface Config {
    file: string;
    destination: string;
    branch?: string;
    languages?: string[];
    languageSwitcher?: boolean;
    uploadSources?: boolean;
    downloadTranslations?: boolean;
}

export {CredentialsConfig, Config};
