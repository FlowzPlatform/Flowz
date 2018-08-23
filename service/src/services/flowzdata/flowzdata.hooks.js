const errors = require('@feathersjs/errors');
let _ = require('lodash');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [
      hook => beforeCreate(hook)
    ],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      hook => afterCreate(hook)
    ],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};

function beforeCreate (hook) {
  console.log('here1')
  hook.data.createdAt = new Date().toISOString();
  hook.params.isdone = true;
  if (hook.data.hasOwnProperty('nextTarget')) {
    hook.params.nextTarget = hook.data.nextTarget;
    delete hook.data.nextTarget;
  }
}

function afterCreate (hook) {
  console.log('here')
  // console.log('_________________________', hook.result.id)
  if (hook.params.hasOwnProperty('isdone') && hook.params.isdone) {
    // console.log('------', hook.result.id, '------');
    hook.params.query = {};
    hook.params.query.$select = ['json'];
    const query = Object.assign({}, hook.params.query);
    return hook.app.service('flowz').get(hook.data.fid, {query}).then(res => {
      let cuurentObj = _.find(res.json.processList, {id: hook.data.state});
      let nextTargetObj = getNextTarget(res.json.processList, cuurentObj.target[0].id);
      return hook.app.service('finstance').get(hook.data.iid).then(finstRes => {
        let mdata = {
          currentStatus: nextTargetObj.id,
          stageReference: finstRes.stageReference
        };
        if (hook.params.hasOwnProperty('nextTarget')) {
          mdata.currentStatus = hook.params.nextTarget;
        }
        mdata.stageReference.push({
          StageName: finstRes.currentStatus,
          stageRecordId: hook.result.id,
          createdAt: new Date().toISOString(),
          userId: (hook.params.userPackageDetails !== undefined ? hook.params.userPackageDetails.id:null)
        });
        if (nextTargetObj.type === 'endevent') {
          mdata.mainStatus = 'completed';
        }
        return hook.app.service('finstance').patch(hook.data.iid, mdata).then(pRes => {
          return hook;
        }).catch(err => {
          throw new errors.BadRequest('Error', {
            errors: { message: err.message }
          });
        });
      }).catch(err => {
        throw new errors.BadRequest('Error', {
          errors: { message: err.message }
        });
      });
      return hook;
    }).catch(err => {
      throw new errors.BadRequest('Error', {
        errors: { message: err.message }
      });
    });
  }
}

function getNextTarget (processList, targetId) {
  let targetObj = _.find(processList,{'id': targetId});
  if (targetObj.type === 'start' || targetObj.type === 'endevent' || targetObj.type === 'intermediatethrowevent') {
    return targetObj;
  }
  if(targetObj.inputProperty.length === 0) {
    targetObj = getNextTarget(processList, targetObj.target[0].id);
  }
  return targetObj;
}
