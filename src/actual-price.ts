import { Red } from "node-red";

export = function (RED: Red) {
    interface Iactual_price {
        end_multiplier: number;
        night_hours: number[];
        day_multiplier: number;
        night_multiplier: number;
    }

    interface Ihour {
        timestamp: string;
        price: number;
        currency: string;
        area: string;
    }

    class actual_price {
        public node: any = null;
        public name: string = "";

        constructor(public config: Iactual_price) {
            (RED as any).nodes.createNode(this, config);
            this.node = this;
            this.node.status({});
            this.node.on("input", this.oninput);
        }

        public static EvaluateNodeProperty<T>(node: any, msg: any, name: string, ignoreerrors: boolean = false) {
            return new Promise<T>((resolve, reject) => {
                const _name = node.config[name];
                let _type = node.config[name + "type"];

                if (_name == null) return resolve(null);
                RED.util.evaluateNodeProperty(_name, _type, node, msg, (err, value) => {
                    if (err && !ignoreerrors) {
                        reject(err);
                    } else {
                        resolve(value);
                    }
                })
            });
        }
        public static SetMessageProperty(msg: any, name: string, value: any) {
            RED.util.setMessageProperty(msg, name, value);
        }

        async oninput(msg: any) {
            try {
                this.node.status({});

                const day_multiplier: number = (await actual_price.EvaluateNodeProperty<number>(this, msg, "day_multiplier")) || 1;
                const night_hours: number[] = (await actual_price.EvaluateNodeProperty<number[]>(this, msg, "night_hours")) || [];
                const night_multiplier: number = (await actual_price.EvaluateNodeProperty<number>(this, msg, "night_multiplier")) || 1;
                const end_multiplier: number = (await actual_price.EvaluateNodeProperty<number>(this, msg, "end_multiplier")) || 1;

                for (let item of msg.payload as Ihour[]) {
                    let hour = new Date(item.timestamp).getHours();

                    if (night_hours.includes(hour)) {
                        item.price *= night_multiplier
                    } else {
                        item.price *= day_multiplier
                    }

                    item.price *= end_multiplier

                    console.log(hour+": "+item.price+" ("+item.timestamp+")");
                }

                // msg.payload = "hello";
                this.node.send(msg);
            } catch (error) {
                this.HandleError(this, error, msg);
            }
        }

        public HandleError(node: any, error: any, msg: any): void {
            console.error(error);
            var message: string = error;
            try {
                if (typeof error === 'string' || error instanceof String) {
                    error = new Error(error as string);
                }
                node.error(error, msg);
            } catch (error) {
                console.error(error);
            }
            try {
                if (message === null || message === undefined || message === "") { message = ""; }
                node.status({ fill: "red", shape: "dot", text: message.toString().substr(0, 32) });
            } catch (error) {
                console.error(error);
            }
        }

    }
    RED.nodes.registerType("actual price", (actual_price as any));
}
