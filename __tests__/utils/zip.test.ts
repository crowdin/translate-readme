// @ts-ignore
import fs from 'fs';
// @ts-ignore
import AdmZip from 'adm-zip';
import {downloadZipAndUnzip} from '../../src/utils/zip';
import {jest, expect, describe, it} from '@jest/globals';
import axios from 'axios';

jest.mock('axios');
jest.mock('fs');
jest.mock('adm-zip');

describe('zip', () => {
    describe('downloadZipAndUnzip', () => {
        it('should download a zip file, extract its contents, and return entries', async () => {
            const zipUrl = 'https://example.com/translations.zip';
            const destination = '/path/to/destination';
            const zipFilePath = `Translations-1690190698873.zip`;

            const mockDateNow = jest.spyOn(Date, 'now');
            mockDateNow.mockReturnValue(1690190698873);

            const responseData = Buffer.from('zip_file_data_here');
            const expectedEntries = ['file1.txt', 'file2.txt'];

            (axios.get as jest.Mock).mockResolvedValue({data: responseData} as never);
            const unlinkSyncMock = jest.spyOn(fs, 'unlinkSync');
            const extractAllToMock = jest.fn();
            const getEntriesMock = jest.fn().mockReturnValueOnce([{entryName: 'file1.txt'}, {entryName: 'file2.txt'}]);
            (AdmZip as jest.Mock).mockImplementation(() => ({
                extractAllTo: extractAllToMock,
                getEntries: getEntriesMock
            }));

            const entries = await downloadZipAndUnzip(zipUrl, destination);

            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(axios.get).toHaveBeenCalledWith(zipUrl, {responseType: 'arraybuffer'});
            expect(AdmZip).toHaveBeenCalledWith(zipFilePath);
            expect(extractAllToMock).toHaveBeenCalledWith(destination, true);
            expect(getEntriesMock).toHaveBeenCalled();
            expect(unlinkSyncMock).toHaveBeenCalledWith(zipFilePath);
            expect(entries).toEqual(expectedEntries);
        });
    });
});
