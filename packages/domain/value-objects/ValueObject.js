export class ValueObject {
    props;
    constructor(props) {
        this.props = Object.freeze({ ...props });
    }
    equals(valueObject) {
        if (valueObject === null || valueObject === undefined) {
            return false;
        }
        if (this === valueObject) {
            return true;
        }
        if (!(valueObject instanceof ValueObject)) {
            return false;
        }
        return this.shallowEqual(this.props, valueObject.props);
    }
    shallowEqual(object1, object2) {
        const keys1 = Object.keys(object1);
        const keys2 = Object.keys(object2);
        if (keys1.length !== keys2.length) {
            return false;
        }
        for (const key of keys1) {
            if (object1[key] !== object2[key]) {
                return false;
            }
        }
        return true;
    }
    toString() {
        return JSON.stringify(this.props);
    }
}
//# sourceMappingURL=ValueObject.js.map