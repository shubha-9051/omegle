// scratch.js — delete after testing
const queue = require("./services/queue");

(async () => {
  await queue.addToQueue("userA");
  await queue.addToQueue("userB");
  console.log(await queue.popPair());   // { caller: 'userA', callee: 'userB' }
  console.log(await queue.popPair());   // null (queue empty)
  process.exit(0);
})();