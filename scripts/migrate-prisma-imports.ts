import { Project } from "ts-morph";

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
});

const sourceFiles = project.getSourceFiles();
const typeMap = {
  Role: 'import type { Role } from "@/lib/types";',
  ArticleStatus: 'import type { ArticleStatus } from "@/lib/types";',
  CommentStatus: 'import type { CommentStatus } from "@/lib/types";',
  Article: 'import type { Article } from "@/lib/types";',
  Category: 'import type { Category } from "@/lib/types";',
};

sourceFiles.forEach(sourceFile => {
  const imports = sourceFile.getImportDeclarations();
  const prismaImport = imports.find(imp => imp.getModuleSpecifierValue() === "@prisma/client");
  
  if (prismaImport) {
    const namedImports = prismaImport.getNamedImports().map(ni => ni.getName());
    prismaImport.remove();
    
    // Add the imports to lib/types
    if (namedImports.length > 0) {
        sourceFile.addImportDeclaration({
            moduleSpecifier: "@/lib/types",
            namedImports: namedImports,
            isTypeOnly: false
        });
    }
    console.log(`Updated ${sourceFile.getFilePath()}`);
  }
});

project.saveSync();
