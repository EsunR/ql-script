declare global {
    var QLAPI: {
        notify: (title: string, desc: string) => void;
    };
}

export {};
