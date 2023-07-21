interface CredentialsConfig {
    projectId: number;
    token: string;
    organization?: string;
}

interface Config {
    file: string;
    destination: string;
    languages: string[];
}

export {CredentialsConfig, Config};
