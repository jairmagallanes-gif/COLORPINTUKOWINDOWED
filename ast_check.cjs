const ts=require('./node_modules/typescript'),fs=require('fs');
const s=fs.readFileSync('server.ts','utf8'); const f=ts.createSourceFile('server.ts',s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
for(const d of f.parseDiagnostics){const lc=f.getLineAndCharacterOfPosition(d.start||s.length); console.log('DIAG',lc.line+1,lc.character+1,ts.flattenDiagnosticMessageText(d.messageText,' '));}
for(const n of f.statements.slice(-25)){const lc=f.getLineAndCharacterOfPosition(n.getStart(f)); const le=f.getLineAndCharacterOfPosition(n.end); console.log(ts.SyntaxKind[n.kind],lc.line+1,'-',le.line+1);}
