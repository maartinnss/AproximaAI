// Intercepta o módulo 'server-only' antes de qualquer import.
// No contexto do worker (Node.js puro, não Next.js), o guard não é necessário.
const Module = require('module');
const orig = Module._load.bind(Module);
Module._load = function (id, parent, isMain) {
  if (id === 'server-only') return {};
  return orig(id, parent, isMain);
};
