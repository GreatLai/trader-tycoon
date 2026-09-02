const DEFAULT_PROFESSION_ID = 'useless';

const PROFESSIONS = Object.freeze({
  useless: Object.freeze({
    id: 'useless',
    name: '无用之人',
    modifyRules: null,
    activeAbility: null
  })
});

function normalizeProfessionId(id) {
  return Object.prototype.hasOwnProperty.call(PROFESSIONS, id) ? id : DEFAULT_PROFESSION_ID;
}

function newProfessionState(id = DEFAULT_PROFESSION_ID) {
  return {
    id: normalizeProfessionId(id),
    activeUsedDay: null,
    data: {}
  };
}

