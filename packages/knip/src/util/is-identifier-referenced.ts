import { IMPORT_STAR } from '../constants.js';
import type { SerializableMap } from '../types/serializable-map.js';
import { type TraceNode, addNodes, createNode, isTrace } from './trace.js';

type Result = {
  isReferenced: boolean;
  hasReExportingEntryFile: boolean;
  traceNode: TraceNode;
};

export const getIsIdentifierReferencedHandler = (serializableMap: SerializableMap, entryPaths: Set<string>) => {
  const isIdentifierReferenced = (
    filePath: string,
    id: string,
    isIncludeEntryExports = false,
    traceNode = createNode(filePath),
    seen = new Set<string>()
  ): Result => {
    let isReferenced = false;
    let hasReExportingEntryFile = entryPaths.has(filePath);

    if (hasReExportingEntryFile) traceNode.isEntry = true;

    if (!isIncludeEntryExports && hasReExportingEntryFile) return { isReferenced, hasReExportingEntryFile, traceNode };

    seen.add(filePath);

    const ids = id.split('.');
    const [identifier, ...rest] = ids;

    const file = serializableMap.get(filePath)?.imported;

    if (!file) return { isReferenced, hasReExportingEntryFile, traceNode };

    if (
      ((identifier !== id && file.refs.has(id)) || identifier === id) &&
      (file.imported.has(identifier) || file.importedAs.has(identifier))
    ) {
      isReferenced = true;
      if (!isTrace) return { isReferenced, hasReExportingEntryFile, traceNode };
      addNodes(traceNode, id, serializableMap, file.imported.get(identifier));
    }

    for (const [exportId, aliases] of file.importedAs.entries()) {
      if (identifier === exportId) {
        for (const alias of aliases.keys()) {
          const aliasedRef = [alias, ...rest].join('.');
          if (file.refs.has(aliasedRef)) {
            isReferenced = true;
            if (!isTrace) return { isReferenced, hasReExportingEntryFile, traceNode };
            addNodes(traceNode, aliasedRef, serializableMap, aliases.get(alias));
          }
        }
      }
    }

    for (const [namespace, byFilePaths] of file.importedNs) {
      if (file.refs.has(`${namespace}.${id}`)) {
        isReferenced = true;
        if (!isTrace) return { isReferenced, hasReExportingEntryFile, traceNode };
        addNodes(traceNode, `${namespace}.${id}`, serializableMap, byFilePaths);
      }

      const reExportedAs = file.reExportedAs.get(namespace);

      if (reExportedAs) {
        for (const [alias, byFilePaths] of reExportedAs) {
          for (const byFilePath of byFilePaths) {
            if (!seen.has(byFilePath)) {
              const child = createNode(byFilePath);
              traceNode.children.add(child);
              const result = isIdentifierReferenced(byFilePath, `${alias}.${id}`, isIncludeEntryExports, child, seen);
              if (result.hasReExportingEntryFile) hasReExportingEntryFile = true;
              if (result.isReferenced) {
                isReferenced = true;
                if (!isTrace) return { isReferenced, hasReExportingEntryFile, traceNode };
              }
            }
          }
        }
      }

      const reExportedNs = file.reExportedNs.get(namespace);

      if (reExportedNs) {
        for (const byFilePath of reExportedNs) {
          if (!seen.has(byFilePath)) {
            const child = createNode(byFilePath);
            traceNode.children.add(child);
            const result = isIdentifierReferenced(byFilePath, `${namespace}.${id}`, isIncludeEntryExports, child, seen);
            if (result.hasReExportingEntryFile) hasReExportingEntryFile = true;
            if (result.isReferenced) {
              isReferenced = true;
              if (!isTrace) return { isReferenced, hasReExportingEntryFile, traceNode };
            }
          }
        }
      }
    }

    const reExportedBy = file.reExportedBy.get(identifier) ?? file.reExportedBy.get(IMPORT_STAR);

    if (reExportedBy) {
      for (const byFilePath of reExportedBy) {
        if (!seen.has(byFilePath)) {
          const child = createNode(byFilePath);
          traceNode.children.add(child);
          const result = isIdentifierReferenced(byFilePath, id, isIncludeEntryExports, child, seen);
          if (result.hasReExportingEntryFile) hasReExportingEntryFile = true;
          if (result.isReferenced) {
            isReferenced = true;
            if (!isTrace) return { isReferenced, hasReExportingEntryFile, traceNode };
          }
        }
      }
    }

    const reExportedAs = file.reExportedAs.get(identifier);

    if (reExportedAs) {
      for (const [alias, byFilePaths] of reExportedAs) {
        for (const byFilePath of byFilePaths) {
          if (!seen.has(byFilePath)) {
            const child = createNode(byFilePath);
            traceNode.children.add(child);
            const ref = [alias, ...rest].join('.');
            const result = isIdentifierReferenced(byFilePath, ref, isIncludeEntryExports, child, seen);
            if (result.hasReExportingEntryFile) hasReExportingEntryFile = true;
            if (result.isReferenced) {
              isReferenced = true;
              if (!isTrace) return { isReferenced, hasReExportingEntryFile, traceNode };
            }
          }
        }
      }
    }

    for (const [namespace, byFilePaths] of file.reExportedNs.entries()) {
      for (const byFilePath of byFilePaths) {
        if (!seen.has(byFilePath)) {
          const child = createNode(byFilePath);
          traceNode.children.add(child);
          const result = isIdentifierReferenced(byFilePath, `${namespace}.${id}`, isIncludeEntryExports, child, seen);
          if (result.hasReExportingEntryFile) hasReExportingEntryFile = true;
          if (result.isReferenced) {
            isReferenced = true;
            if (!isTrace) return { isReferenced, hasReExportingEntryFile, traceNode };
          }
        }
      }
    }

    return { isReferenced, hasReExportingEntryFile, traceNode };
  };

  return isIdentifierReferenced;
};
