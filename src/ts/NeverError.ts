

export class NeverError extends Error {

    constructor(arg: never, message: string) {
        super(message);
    }

}