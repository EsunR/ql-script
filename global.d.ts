declare global {
    var QLAPI: {
        notify: (title: string, desc: string) => void;
        getEnvs: (params: {
            searchValue: string;
        }) => Promise<{ data: { id: number; name: string; value: string }[] }>;
    };
}

export {};
