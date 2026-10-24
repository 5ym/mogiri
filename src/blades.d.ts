// Blades の層入りの部品(@anyblades/blades/layered/*)は CSS だけで型がない。TypeScript 6 は
// 型のない副作用 import を誤りにする(noUncheckedSideEffectImports)ので、中身のないモジュールとして宣言する
declare module "@anyblades/blades/layered/*" {}
