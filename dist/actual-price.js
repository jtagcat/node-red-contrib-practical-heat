"use strict";
module.exports = function (RED) {
    class actual_price {
        constructor(config) {
            this.config = config;
            this.node = null;
            this.name = "";
            RED.nodes.createNode(this, config);
            this.node = this;
            this.node.status({});
            this.node.on("input", this.oninput);
        }
        static EvaluateNodeProperty(node, msg, name, ignoreerrors = false) {
            return new Promise((resolve, reject) => {
                const _name = node.config[name];
                let _type = node.config[name + "type"];
                if (_name == null)
                    return resolve(null);
                RED.util.evaluateNodeProperty(_name, _type, node, msg, (err, value) => {
                    if (err && !ignoreerrors) {
                        reject(err);
                    }
                    else {
                        resolve(value);
                    }
                });
            });
        }
        static SetMessageProperty(msg, name, value) {
            RED.util.setMessageProperty(msg, name, value);
        }
        async oninput(msg) {
            try {
                this.node.status({});
                const day_multiplier = (await actual_price.EvaluateNodeProperty(this, msg, "day_multiplier")) || 1;
                const night_hours = (await actual_price.EvaluateNodeProperty(this, msg, "night_hours")) || [];
                const night_multiplier = (await actual_price.EvaluateNodeProperty(this, msg, "night_multiplier")) || 1;
                const end_multiplier = (await actual_price.EvaluateNodeProperty(this, msg, "end_multiplier")) || 1;
                for (let item of msg.payload) {
                    let hour = new Date(item.timestamp).getHours();
                    if (night_hours.includes(hour)) {
                        item.price *= night_multiplier;
                    }
                    else {
                        item.price *= day_multiplier;
                    }
                    item.price *= end_multiplier;
                    console.log(hour + ": " + item.price + " (" + item.timestamp + ")");
                }
                // msg.payload = "hello";
                this.node.send(msg);
            }
            catch (error) {
                this.HandleError(this, error, msg);
            }
        }
        HandleError(node, error, msg) {
            console.error(error);
            var message = error;
            try {
                if (typeof error === 'string' || error instanceof String) {
                    error = new Error(error);
                }
                node.error(error, msg);
            }
            catch (error) {
                console.error(error);
            }
            try {
                if (message === null || message === undefined || message === "") {
                    message = "";
                }
                node.status({ fill: "red", shape: "dot", text: message.toString().substr(0, 32) });
            }
            catch (error) {
                console.error(error);
            }
        }
    }
    RED.nodes.registerType("actual price", actual_price);
};
//# sourceMappingURL=actual-price.js.map