export interface IPagedList<T>{
    page: number;
    page_size: number;
    total_pages: number;
    total_items: number;
    items: T[];
}