/* eslint-disable @typescript-eslint/no-require-imports */
// Silencia o guard 'server-only' no contexto do worker Node.js (não-Next.js).
// tsx 4.x com Module._load patching não funciona de forma confiável;
// pré-popular o cache do módulo antes de qualquer require é a abordagem correta.
const Module = require('module');

// Resolve o path real do pacote sem executá-lo
const serverOnlyPath = require.resolve('server-only');

// Injeta módulo vazio no cache — qualquer require('server-only') subsequente
// retorna {} sem executar o index.js que lança o erro
Module._cache[serverOnlyPath] = {
  id: serverOnlyPath,
  filename: serverOnlyPath,
  loaded: true,
  parent: null,
  children: [],
  exports: {},
  paths: [],
};
