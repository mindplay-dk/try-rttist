import 'rttist/typelib';

import { Type, getType } from "rttist";

// --- FRAMEWORK ---

type FactoryMap = Map<string, (container: Container) => Promise<unknown>>;

class ContainerFactory {
  private factories: FactoryMap = new Map();

  register<T>(create: (...deps: unknown[]) => T | Promise<T>): void {
    const type = getType<T>();

    if (type.isClass() && !type.abstract) {
      this.factories.set(type.id, async (container) => {
        const module = await type.module.import();

        console.log({module});

        const ctors = type.getConstructors();

        if (ctors.length !== 1) {
          throw new Error(`overloaded constructors are not supported: ${type.name}`);
        }

        const ctorFunc = module[type.name] as { new (...args: unknown[]): unknown };

        const params = ctors[0].getParameters();

        const args = params.map(param => {
          if (this.has(param.type)) {
            return container.get(param.type);
          } else {
            throw new Error(`dependency ${param.type.name} ${param.name} not found for constructor of ${type.name}`);
          }
        });

        return new ctorFunc(...args);
      });
    } else {
      throw new Error(`unsupported type: ${type.name}`);
    }
  }

  has(type: Type): boolean {
    return this.factories.has(type.id);
  }

  createContainer(): Container {
    return new Container(this.factories);
  }
}

class Container {
  constructor(private factories: FactoryMap) {}

  private instances = new Map<string, Promise<unknown>>();

  async get<T>(type?: Type): Promise<T> {
    type = type || getType<T>();

    if (! this.factories.has(type.id)) {
      throw new Error(`undefined component ${type.name}`);
    }

    if (! this.instances.has(type.id)) {
      this.instances[type.id] = this.factories.get(type.id)(this);
    }

    return this.instances.get(type.id) as Promise<T>;
  }
}

// --- EXAMPLE ---

class UserRepo {
  getUsers() {
    return [{ name: "Bob", age: "42" }];
  }
}

/*
(async () => {
  const factory = new ContainerFactory();

  factory.register<UserRepo>(() => new UserRepo());
  
  const container = factory.createContainer();
  
  const userRepo = await container.get<UserRepo>();

  console.log(userRepo.getUsers())
})();
*/

function run<T>(fn: () => T): T {
  const type = getType<T>();

  console.log({type});

  return fn();
}

run(() => new UserRepo());

run<UserRepo>(() => new UserRepo());
