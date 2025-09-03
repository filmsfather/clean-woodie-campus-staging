import { UniqueEntityID } from '../common/Identifier';
export class Entity {
    _id;
    props;
    constructor(props, id) {
        this._id = id ? id : new UniqueEntityID();
        this.props = props;
    }
    get id() {
        return this._id;
    }
    equals(entity) {
        if (entity === null || entity === undefined) {
            return false;
        }
        if (this === entity) {
            return true;
        }
        if (!(entity instanceof Entity)) {
            return false;
        }
        return this._id.equals(entity.id);
    }
}
//# sourceMappingURL=Entity.js.map