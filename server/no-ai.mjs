// Zancut 2D uses no AI: anything that would call Claude lands here and stops with a plain sentence.
const off = () => { throw Object.assign(new Error('AI is switched off in Zancut 2D.'), { customer: true }); };
export const query = () => off();
export const createSdkMcpServer = () => ({});
export const tool = () => ({});
