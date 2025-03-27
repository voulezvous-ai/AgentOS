const { exec } = require("child_process");

test("Build do frontend deve rodar sem erros", (done) => {
    exec("npm run build", { cwd: "../frontend" }, (error, stdout, stderr) => {
        if (error) {
            console.error(stderr);
            done(error);
        } else {
            console.log(stdout);
            done();
        }
    });
});