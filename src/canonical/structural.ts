import type { CanonicalId, EdgeId } from "./brand.js";

/** Source location within a file */
export interface SourceRange {
  readonly file: string;
  readonly startLine: number;
  readonly startColumn: number;
  readonly endLine: number;
  readonly endColumn: number;
}

/** Provenance: where a canonical entity came from (separate from identity) */
export interface SourceOrigin {
  readonly language: string;
  readonly file: string;
  readonly range: SourceRange;
  readonly astNodeKind?: string;
  readonly nativeId?: string;
}

/**
 * Namespaced extension data for language-specific metadata.
 * Each namespace isolates one adapter's extras from the core model.
 */
export interface ExtensionData {
  readonly namespace: string;
  readonly data: Readonly<Record<string, unknown>>;
}

/** Every canonical node carries a stable identifier and provenance. */
export interface CanonicalNodeBase {
  /** Stable, language-agnostic ID */
  readonly id: CanonicalId;
  /** Human-readable name */
  readonly name: string;
  /** Language the node was extracted from */
  readonly language: string;
  /** Provenance: source origin(s) for this entity */
  readonly sourceOrigins?: readonly SourceOrigin[];
  /** Language-specific extension data, namespaced per adapter */
  readonly extensions?: readonly ExtensionData[];
}

export interface PackageNode extends CanonicalNodeBase {
  readonly kind: "package";
}

export interface ModuleNode extends CanonicalNodeBase {
  readonly kind: "module";
  /** Enclosing package id */
  readonly packageId?: CanonicalId;
}

export interface ClassNode extends CanonicalNodeBase {
  readonly kind: "class";
  /** Module or package that contains this class */
  readonly parentId?: CanonicalId;
  readonly isAbstract?: boolean;
  readonly typeParameters?: readonly string[];
}

export interface InterfaceNode extends CanonicalNodeBase {
  readonly kind: "interface";
  readonly parentId?: CanonicalId;
  readonly typeParameters?: readonly string[];
}

export interface FunctionNode extends CanonicalNodeBase {
  readonly kind: "function";
  readonly parentId?: CanonicalId;
  readonly parameters: readonly ParameterInfo[];
  readonly returnType?: string;
  readonly isAsync?: boolean;
  readonly isStatic?: boolean;
  readonly visibility?: Visibility;
}

export interface FieldNode extends CanonicalNodeBase {
  readonly kind: "field";
  readonly parentId: CanonicalId;
  readonly type?: string;
  readonly isStatic?: boolean;
  readonly visibility?: Visibility;
}

export interface VariableNode extends CanonicalNodeBase {
  readonly kind: "variable";
  readonly parentId?: CanonicalId;
  readonly type?: string;
  readonly isConst?: boolean;
}

export interface EnumNode extends CanonicalNodeBase {
  readonly kind: "enum";
  readonly parentId?: CanonicalId;
  readonly members: readonly string[];
}

export interface TypeAliasNode extends CanonicalNodeBase {
  readonly kind: "typeAlias";
  readonly parentId?: CanonicalId;
  readonly aliasedType: string;
}

export type Visibility = "public" | "protected" | "private";

export interface ParameterInfo {
  readonly name: string;
  readonly type?: string;
  readonly isOptional?: boolean;
  readonly defaultValue?: string;
}

export type StructuralNode =
  | PackageNode
  | ModuleNode
  | ClassNode
  | InterfaceNode
  | FunctionNode
  | FieldNode
  | VariableNode
  | EnumNode
  | TypeAliasNode;

export type StructuralNodeKind = StructuralNode["kind"];

export interface CanonicalEdge {
  readonly id: EdgeId;
  readonly sourceId: CanonicalId;
  readonly targetId: CanonicalId;
}

export interface ContainmentEdge extends CanonicalEdge {
  readonly kind: "containment";
}

export interface InheritanceEdge extends CanonicalEdge {
  readonly kind: "inheritance";
}

export interface ImplementsEdge extends CanonicalEdge {
  readonly kind: "implements";
}

export interface ImportEdge extends CanonicalEdge {
  readonly kind: "import";
}

export interface InvocationEdge extends CanonicalEdge {
  readonly kind: "invocation";
}

export interface AccessEdge extends CanonicalEdge {
  readonly kind: "access";
}

export interface DependencyEdge extends CanonicalEdge {
  readonly kind: "dependency";
}

export type StructuralEdge =
  | ContainmentEdge
  | InheritanceEdge
  | ImplementsEdge
  | ImportEdge
  | InvocationEdge
  | AccessEdge
  | DependencyEdge;

export type StructuralEdgeKind = StructuralEdge["kind"];
