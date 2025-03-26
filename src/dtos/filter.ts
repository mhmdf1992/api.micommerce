export interface IFilter{
    page: number;
    page_size: number;
    equal: [{ field: string, value: any}];
    between: [{ field: string, from: any, to: any }];
    regex: [{ field: string, pattern: string }];
    sort: { field: string, order: string };
}