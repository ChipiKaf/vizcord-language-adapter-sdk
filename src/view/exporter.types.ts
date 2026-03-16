import type { ViewModel } from "./view-model.types.js";

export interface Exporter {
  readonly format: string;
  readonly fileExtension: string;
  export(view: ViewModel): string;
}
