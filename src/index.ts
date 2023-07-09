import 'rttist/typelib';

import { getType } from "rttist";

class UserRepo {
  getUsers() {
    return [{ name: "Bob", age: "42" }];
  }
}

function run<T>(fn: () => T): T {
  const type = getType<T>();

  console.log(type.id);

  return fn();
}

run(() => new UserRepo()); // 👎 ::invalid::Invalid

run<UserRepo>(() => new UserRepo()); // 👍 @try-rttist/dist/index::UserRepo
