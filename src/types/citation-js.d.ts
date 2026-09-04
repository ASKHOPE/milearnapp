declare module 'citation-js' {
  export default class Cite {
    constructor(data?: any, options?: any);
    get(options?: any): any;
    format(format: string, options?: any): string;
    set(data: any): this;
    add(data: any): this;
    static async(data: any, options?: any): Promise<Cite>;
  }
}
