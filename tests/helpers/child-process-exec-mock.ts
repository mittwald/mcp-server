import { vi } from 'vitest';

vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

const childProcess = await import('child_process');
export const execMock = childProcess.exec as unknown as ReturnType<typeof vi.fn>;

const promisifySymbol = Symbol.for('nodejs.util.promisify.custom');
(execMock as any)[promisifySymbol] = (command: string, options: any) => {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    execMock(command, options, (error: any, stdout: string, stderr: string) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
};

export const resetExecMock = () => execMock.mockReset();
