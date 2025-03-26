export class BadRequest extends Error{
    parameter: string;
    constructor(parameter: string, message: string){
        super(message);
        this.parameter = parameter;
    }
}