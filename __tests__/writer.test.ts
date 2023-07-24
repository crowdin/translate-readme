// @ts-ignore
import fs from 'fs';
import {Writer} from '../src/writer';
import {Logger} from '../src/logger';
import {Config, CredentialsConfig} from '../src/config';
import {jest, expect, describe, it, beforeEach} from '@jest/globals';

jest.mock('fs');

describe('Writer', () => {
    const credentials: CredentialsConfig = {token: 'API_TOKEN', projectId: 1};
    const config: Config = {languageSwitcher: true, destination: 'docs', file: 'README.md'};
    const logger: Logger = {
        log: jest.fn()
    };

    let writer: Writer;

    beforeEach(() => {
        jest.resetAllMocks();

        writer = new Writer(credentials, config, logger);

        writer.setProjectLanguages([
            {
                id: 'fr',
                name: 'French',
                locale: 'fr',
                editorCode: 'fr',
                twoLettersCode: 'fr',
                threeLettersCode: 'fra',
                androidCode: 'fr',
                osxCode: 'fr',
                osxLocale: 'fr',
                pluralCategoryNames: ['one', 'other'],
                pluralRules: 'nplurals=2; plural=(n > 1);',
                pluralExamples: ['1', '0'],
                textDirection: 'ltr',
                dialectOf: 'fr'
            },
            {
                id: 'uk',
                name: 'Ukrainian',
                locale: 'uk',
                editorCode: 'uk',
                twoLettersCode: 'uk',
                threeLettersCode: 'ukr',
                androidCode: 'uk',
                osxCode: 'uk',
                osxLocale: 'uk',
                pluralCategoryNames: ['one', 'few', 'many', 'other'],
                pluralRules: 'rules_placeholder',
                pluralExamples: ['1', '0', '5', '11'],
                textDirection: 'ltr',
                dialectOf: ''
            }
        ]);
    });

    describe('addLanguageSwitcher', () => {
        it('should skip adding language switcher if placeholders are missing in the file', async () => {
            const file = '/path/to/README.md';
            const mockFileContents = 'Some content without placeholders';

            (fs.readFileSync as jest.Mock).mockReturnValueOnce(mockFileContents);

            await writer.addLanguageSwitcher(file);

            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(logger.log).toHaveBeenCalledWith(
                'warning',
                `Skipped! Please add ${writer['placeholderStart']} and ${writer['placeholderEnd']} to your README.md`
            );

            // Ensure the file contents are not modified
            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });

        it('should add language switcher to the file with correct contents', async () => {
            const file = 'README.md';
            const mockFileContents = `
Some content before
<!-- TRANSLATE-README-LANGUAGES-START -->
<!-- TRANSLATE-README-LANGUAGES-END -->
Some content after
`;

            const expectedSwitcher = '[English](docs/README.en.md) | [French](docs/README.fr.md)';

            (fs.readFileSync as jest.Mock).mockReturnValueOnce(mockFileContents);
            (writer as any).projectLanguages = [
                {name: 'English', locale: 'en'},
                {name: 'French', locale: 'fr'}
            ];

            await writer.addLanguageSwitcher(file);

            const expectedUpdatedFileContents = `
Some content before
<!-- TRANSLATE-README-LANGUAGES-START -->
${expectedSwitcher}
<!-- TRANSLATE-README-LANGUAGES-END -->
Some content after
`;

            expect(fs.writeFileSync).toHaveBeenCalledWith(file, expectedUpdatedFileContents);
        });
    });

    describe('renderSwitcher', () => {
        it('should render the language switcher correctly', async () => {
            const file = 'README.md';
            const switcher = await writer.renderSwitcher(file);
            const expectedSwitcher = '[French](docs/README.fr.md) | [Ukrainian](docs/README.uk.md)';

            expect(switcher).toEqual(expectedSwitcher);
        });

        it('should not render a link for the current language', async () => {
            const file = 'README.fr.md';
            const switcher = await writer.renderSwitcher(file);
            const expectedSwitcher = '**French** | [Ukrainian](docs/README.uk.md)';

            expect(switcher).toEqual(expectedSwitcher);
        });
    });
});
