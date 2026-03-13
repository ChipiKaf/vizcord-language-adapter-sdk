// ---------------------------------------------------------------------------
// Canonical IR – Structural Sub-model (FAMIX / KDM inspired)
// ---------------------------------------------------------------------------

/** Source location within a file */
export interface SourceRange {
  file: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

/** Every canonical node carries a stable identifier and provenance. */
export interface CanonicalNodeBase {
  /** Stable, language-agnostic ID (e.g. "pkg:module:ClassName") */
  id: string;
  /** Human-readable name */
  name: string;
  /** Language the node was extracted from */
  language: string;
  /** Original source location */
  sourceRange?: SourceRange;
  /** Arbitrary metadata */
  metadata?: Record<string, unknown>;
}

// ---- Structural node types ------------------------------------------------

export interface PackageNode extends CanonicalNodeBase {
  kind: "package";
}

export interface ModuleNode extends CanonicalNodeBase {
  kind: "module";
  /** Enclosing package id */
  packageId?: string;
}

export interface ClassNode extends CanonicalNodeBase {
  kind: "class";
  /** Module or package that contains this class */
  parentId?: string;
  isAbstract?: boolean;
  typeParameters?: string[];
}

export interface InterfaceNode extends CanonicalNodeBase {
  kind: "interface";
  parentId?: string;
  typeParameters?: string[];
}

export interface FunctionNode extends CanonicalNodeBase {
  kind: "function";
  parentId?: string;
  parameters: ParameterInfo[];
  returnType?: string;
  isAsync?: boolean;
  isStatic?: boolean;
  visibility?: Visibility;
}

export interface FieldNode extends CanonicalNodeBase {
  kind: "field";
  parentId: string;
  type?: string;
  isStatic?: boolean;
  visibility?: Visibility;
}

export interface VariableNode extends CanonicalNodeBase {
  kind: "variable";
  parentId?: string;
  type?: string;
  isConst?: boolean;
}

export interface EnumNode extends CanonicalNodeBase {
  kind: "enum";
  parentId?: string;
  members: string[];
}

export interface TypeAliasNode extends CanonicalNodeBase {
  kind: "typeAlias";
  parentId?: string;
  aliasedType: string;
}

// ---- Supporting types -----------------------------------------------------

export type Visibility = "public" | "protected" | "private";

export interface ParameterInfo {
  name: string;
  type?: string;
  isOptional?: boolean;
  defaultValue?: string;
}

// ---- Union of all structural nodes ----------------------------------------

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

// ---- Structural edge types ------------------------------------------------

export interface CanonicalEdge {
  id: string;
  sourceId: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}

export interface ContainmentEdge extends CanonicalEdge {
  kind: "containment";
}

export interface InheritanceEdge extends CanonicalEdge {
  kind: "inheritance";
}

export interface ImplementsEdge extends CanonicalEdge {
  kind: "implements";
}

export interface ImportEdge extends CanonicalEdge {
  kind: "import";
}

export interface InvocationEdge extends CanonicalEdge {
  kind: "invocation";
}

export interface AccessEdge extends CanonicalEdge {
  kind: "access";
}

export interface DependencyEdge extends CanonicalEdge {
  kind: "dependency";
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
