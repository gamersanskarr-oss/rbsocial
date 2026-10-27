/* In-memory Firestore stand-in for unit tests.
   Mirrors just the API surface our server actions use:
   collection().doc().get/set/update/delete, .add, .where("=="), .get, batch.
   Timestamps carry real Date objects so `instanceof Timestamp` + `.toDate()`
   keep working in the real data layer. */

type Data = Record<string, unknown>;

const store = new Map<string, Data>();
let seq = 0;

export class FakeTimestamp {
  private d: Date;
  constructor(d: Date) {
    this.d = d;
  }
  static fromDate(d: Date) {
    return new FakeTimestamp(d);
  }
  static now() {
    return new FakeTimestamp(new Date());
  }
  toDate() {
    return this.d;
  }
}
export const ts = (d: Date) => new FakeTimestamp(d);

export class FakeFieldValue {
  private constructor(
    public kind: "inc" | "now" | "del",
    public arg?: number
  ) {}
  static increment(n: number) {
    return new FakeFieldValue("inc", n);
  }
  static serverTimestamp() {
    return new FakeFieldValue("now");
  }
  static delete() {
    return new FakeFieldValue("del");
  }
}

const merge = (cur: Data | undefined, u: Data): Data => {
  const next: Data = { ...(cur ?? {}) };
  for (const [k, v] of Object.entries(u)) {
    if (v instanceof FakeFieldValue) {
      if (v.kind === "inc") next[k] = Number(next[k] ?? 0) + (v.arg ?? 0);
      else if (v.kind === "now") next[k] = FakeTimestamp.now();
      else delete next[k];
    } else {
      next[k] = v;
    }
  }
  return next;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const refOf = (path: string): any => ({
  id: path.split("/").pop() as string,
  get: async () => snapOf(path),
  set: async (d: Data) => {
    store.set(path, d);
  },
  update: async (u: Data) => {
    store.set(path, merge(store.get(path), u));
  },
  delete: async () => {
    store.delete(path);
  },
});

const snapOf = (path: string) => ({
  id: path.split("/").pop() as string,
  exists: store.has(path),
  data: () => store.get(path),
  ref: refOf(path),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const collection = (name: string): any => ({
  doc: (id?: string) => refOf(`${name}/${id ?? `auto-${++seq}`}`),
  add: async (d: Data) => {
    const path = `${name}/auto-${++seq}`;
    store.set(path, merge(undefined, d));
    return refOf(path);
  },
  where: (field: string, _op: string, value: unknown) => ({
    get: async () => ({
      docs: [...store.entries()]
        .filter(([k, v]) => k.startsWith(`${name}/`) && v[field] === value)
        .map(([k]) => snapOf(k)),
    }),
  }),
  get: async () => ({
    docs: [...store.keys()]
      .filter((k) => k.startsWith(`${name}/`))
      .map((k) => snapOf(k)),
  }),
});

export const fakeDb = {
  collection,
  batch: () => {
    const ops: { ref: { update: (u: Data) => Promise<void> }; u: Data }[] = [];
    return {
      update(ref: { update: (u: Data) => Promise<void> }, u: Data) {
        ops.push({ ref, u });
      },
      async commit() {
        for (const { ref, u } of ops) await ref.update(u);
      },
    };
  },
};

/* Test helpers */
export const seed = (path: string, data: Data) => {
  store.set(path, data);
};
export const doc = (path: string) => store.get(path);
export const resetDb = () => {
  store.clear();
  seq = 0;
};
