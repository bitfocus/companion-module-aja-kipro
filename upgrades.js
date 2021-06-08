module.exports = [
    function (context, config, actions, feedbacks) {
        if (config) {
            // just an example
            if (config.host !== undefined) {
                config.old_host = config.host;
            }
        }
    },
    function (context, config, actions, feedbacks) {
        let changed = false;

        if (config) {
            if (config.polling == undefined) {
                config.polling = false; //Default polling off for existing users
                changed = true;
            }

            if (config.pollingRate == undefined){
                config.pollingRate = 100; //Default polling rate to 100mS
                changed = true;
            }

            if (config.password == undefined){
                config.password = ""; //Default password to be empty
                changed = true;
            }
        }

        return changed;
    }
]