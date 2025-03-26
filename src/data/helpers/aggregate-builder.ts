import { ObjectId } from "mongodb";
import { IFilter } from "../../dtos/filter";

export class AggregateBuilder{
    public static build = (filter: IFilter): any[] => {
        const match: any = {};
        if(filter.equal && filter.equal.length > 0){
            filter.equal.forEach(equal =>{
                if(equal.field && equal.value)
                    match[equal.field] = equal.value;
            })
        } 
        if(filter.between && filter.between.length > 0){
            filter.between.forEach(between => {
                if(between && (between.from || between.to))
                    match[between.field] = {};
                if(between && between.from)
                    match[between.field].$gt = typeof between.from === "string" && isIsoDate(between.from) ? new Date(between.from) : between.from;
                if(between && between.to)
                    match[between.field].$lt = typeof between.to === "string" && isIsoDate(between.to) ? new Date(between.to) : between.to;
            });
        }
        if(filter.regex && filter.regex.length > 0){
            filter.regex.forEach(regex =>{
                if(regex.field && regex.pattern)
                    match[regex.field] = {$regex: regex.pattern}
            })
        }   
        const sort = {}
        if(filter.sort && filter.sort.field)
            sort[filter.sort.field] = 1;
        if(filter.sort && filter.sort.field && filter.sort.order)
            sort[filter.sort.field] = filter.sort.order == "ascending" ? 1 : -1;
        return [
            { $match: match },
            { $sort: sort},
            {
                $facet: {
                    metadata: [{ $count: 'total' }],
                    data: [{ $skip: (filter.page - 1) * filter.page_size }, { $limit: filter.page_size }],
                },
            }
        ]
    }
}
const isIsoDate = (str) => {
    if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
    const d = new Date(str); 
    return !isNaN(d.getTime()) && d.toISOString()===str; // valid date 
}