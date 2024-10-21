export const extractExtension = (name: string): string => {
  const parts = name.split(".");
  return parts.pop() ?? "";
};

/* eslint-disable @typescript-eslint/no-unsafe-return */
export const ext2langLoader: { [lang: string]: () => Promise<void> } = {
  markup: async () => await import("prismjs/components/prism-markup"),
  css: async () => await import("prismjs/components/prism-css"),
  scss: async () => await import("prismjs/components/prism-scss"),
  less: async () => await import("prismjs/components/prism-less"),
  javascript: async () => await import("prismjs/components/prism-javascript"),
  typescript: async () => await import("prismjs/components/prism-typescript"),
  tsx: async () => await import("prismjs/components/prism-tsx"),
  jsx: async () => await import("prismjs/components/prism-jsx"),
  json: async () => await import("prismjs/components/prism-json"),
  aspnet: async () => await import("prismjs/components/prism-aspnet"),
  actionscript: async () =>
    await import("prismjs/components/prism-actionscript"),
  python: async () => await import("prismjs/components/prism-python"),
  ruby: async () => await import("prismjs/components/prism-ruby"),
  php: async () => await import("prismjs/components/prism-php"),
  java: async () => await import("prismjs/components/prism-java"),
  clike: async () => await import("prismjs/components/prism-clike"),
  c: async () => await import("prismjs/components/prism-c"),
  cpp: async () => await import("prismjs/components/prism-cpp"),
  csharp: async () => await import("prismjs/components/prism-csharp"),
  go: async () => await import("prismjs/components/prism-go"),
  rust: async () => await import("prismjs/components/prism-rust"),
  swift: async () => await import("prismjs/components/prism-swift"),
  kotlin: async () => await import("prismjs/components/prism-kotlin"),
  dart: async () => await import("prismjs/components/prism-dart"),
  bash: async () => await import("prismjs/components/prism-bash"),
  perl: async () => await import("prismjs/components/prism-perl"),
  r: async () => await import("prismjs/components/prism-r"),
  scala: async () => await import("prismjs/components/prism-scala"),
  lua: async () => await import("prismjs/components/prism-lua"),
  lisp: async () => await import("prismjs/components/prism-lisp"),
  clojure: async () => await import("prismjs/components/prism-clojure"),
  haskell: async () => await import("prismjs/components/prism-haskell"),
  ocaml: async () => await import("prismjs/components/prism-ocaml"),
  elm: async () => await import("prismjs/components/prism-elm"),
  erlang: async () => await import("prismjs/components/prism-erlang"),
  elixir: async () => await import("prismjs/components/prism-elixir"),
  fsharp: async () => await import("prismjs/components/prism-fsharp"),
  nim: async () => await import("prismjs/components/prism-nim"),
  crystal: async () => await import("prismjs/components/prism-crystal"),
  d: async () => await import("prismjs/components/prism-d"),
  ada: async () => await import("prismjs/components/prism-ada"),
  fortran: async () => await import("prismjs/components/prism-fortran"),
  pascal: async () => await import("prismjs/components/prism-pascal"),
  abap: async () => await import("prismjs/components/prism-abap"),
  racket: async () => await import("prismjs/components/prism-racket"),
  yaml: async () => await import("prismjs/components/prism-yaml"),
  ini: async () => await import("prismjs/components/prism-ini"),
  toml: async () => await import("prismjs/components/prism-toml"),
  properties: async () => await import("prismjs/components/prism-properties"),
  vim: async () => await import("prismjs/components/prism-vim"),
  "go-module": async () => await import("prismjs/components/prism-go-module"),
  ignore: async () => await import("prismjs/components/prism-ignore"),
  git: async () => await import("prismjs/components/prism-git"),
  makefile: async () => await import("prismjs/components/prism-makefile"),
  cmake: async () => await import("prismjs/components/prism-cmake"),
  gradle: async () => await import("prismjs/components/prism-gradle"),
  groovy: async () => await import("prismjs/components/prism-groovy"),
  markdown: async () => await import("prismjs/components/prism-markdown"),
  rest: async () => await import("prismjs/components/prism-rest"),
  asciidoc: async () => await import("prismjs/components/prism-asciidoc"),
  latex: async () => await import("prismjs/components/prism-latex"),
  csv: async () => await import("prismjs/components/prism-csv"),
  "excel-formula": async () =>
    await import("prismjs/components/prism-excel-formula"),
  awk: async () => await import("prismjs/components/prism-awk"),
  powershell: async () => await import("prismjs/components/prism-powershell"),
  docker: async () => await import("prismjs/components/prism-docker"),
  hcl: async () => await import("prismjs/components/prism-hcl"),
  graphql: async () => await import("prismjs/components/prism-graphql"),
  cypher: async () => await import("prismjs/components/prism-cypher"),
  sql: async () => await import("prismjs/components/prism-sql"),
  http: async () => await import("prismjs/components/prism-http"),
  "arm-asm": async () => await import("prismjs/components/prism-armasm"),
  nasm: async () => await import("prismjs/components/prism-nasm"),
  verilog: async () => await import("prismjs/components/prism-verilog"),
  vhdl: async () => await import("prismjs/components/prism-vhdl"),
  arduino: async () => await import("prismjs/components/prism-arduino"),
  autohotkey: async () => await import("prismjs/components/prism-autohotkey"),
  matlab: async () => await import("prismjs/components/prism-matlab"),
  stan: async () => await import("prismjs/components/prism-stan"),
  solidity: async () => await import("prismjs/components/prism-solidity"),
  glsl: async () => await import("prismjs/components/prism-glsl"),
  hlsl: async () => await import("prismjs/components/prism-hlsl"),
  dot: async () => await import("prismjs/components/prism-dot"),
  batch: async () => await import("prismjs/components/prism-batch"),
  xquery: async () => await import("prismjs/components/prism-xquery"),
};
/* eslint-enable @typescript-eslint/no-unsafe-return */

export const ext2lang: { [ext: string]: string } = {
  // Markup Languages
  html: "markup",
  htm: "markup",
  xml: "markup",
  svg: "markup",
  mathml: "markup",
  rss: "markup",
  atom: "markup",
  xsl: "markup",
  xslt: "markup",

  // Stylesheets
  css: "css",
  scss: "scss",
  sass: "scss",
  less: "less",

  // Web Languages
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  tsx: "tsx",
  jsx: "jsx",
  json: "json",
  webmanifest: "json",
  asp: "aspnet",

  // General Programming Languages
  as: "actionscript",
  py: "python",
  rb: "ruby",
  php: "php",
  java: "java",
  c: "c",
  cpp: "cpp",
  h: "cpp",
  cs: "csharp",
  go: "go",
  rs: "rust",
  swift: "swift",
  kt: "kotlin",
  dart: "dart",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  fish: "bash",
  pl: "perl",
  r: "r",
  scala: "scala",
  lua: "lua",
  el: "lisp",
  clj: "clojure",
  hs: "haskell",
  ml: "ocaml",
  elm: "elm",
  erl: "erlang",
  ex: "elixir",
  exs: "elixir",
  fs: "fsharp",
  nim: "nim",
  cr: "crystal",
  d: "d",
  ada: "ada",
  for: "fortran",
  f90: "fortran",
  pas: "pascal",
  abap: "abap",
  rkt: "racket",

  // Scripting and Config Files
  yaml: "yaml",
  yml: "yaml",
  ini: "ini",
  toml: "toml",
  env: "bash",
  properties: "properties",
  ignore: "bash",
  vim: "vim",

  // Package Manager and Lock Files
  npmrc: "bash",
  lock: "json",
  mod: "go-module",

  // Version Control and DevOps
  gitignore: "ignore",
  gitattributes: "git",
  gitconfig: "git",
  gitmodules: "git",

  // Makefiles and CI/CD
  makefile: "makefile",
  cmake: "cmake",
  gradle: "gradle",
  jenkinsfile: "groovy",
  groovy: "groovy",

  // Documentation and Markdown
  md: "markdown",
  markdown: "markdown",
  rst: "rest",
  adoc: "asciidoc",
  asciidoc: "asciidoc",
  tex: "latex",

  // Data and Configuration Formats
  csv: "csv",
  tsv: "csv",
  xlsx: "excel-formula",
  xls: "excel-formula",

  // Shell and Terminals
  ksh: "bash",
  csh: "bash",
  tcsh: "bash",
  awk: "awk",
  ps: "powershell",
  ps1: "powershell",
  psm1: "powershell",
  psd1: "powershell",

  // Docker and Infrastructure as Code
  dockerfile: "docker",
  tf: "hcl",
  hcl: "hcl",

  // Graph and Query Languages
  graphql: "graphql",
  cypher: "cypher",
  gql: "graphql",
  sql: "sql",
  psql: "sql",
  pgsql: "sql",
  mysql: "sql",
  sqlite: "sql",
  pls: "plsql",

  // API and Networking
  http: "http",
  rest: "http",

  // Assembly and Machine Languages
  asm: "arm-asm",
  s: "arm-asm",
  nasm: "nasm",

  // Verilog and Hardware Description
  sv: "verilog",
  v: "verilog",
  vhd: "vhdl",
  vhdl: "vhdl",
  hdl: "vhdl",
  ino: "arduino",
  pde: "arduino",

  // Metaprogramming and Macros
  ahk: "autohotkey",

  // Other
  matlab: "matlab",
  m: "matlab",
  stan: "stan",
  sol: "solidity",
  rlib: "rust",
  glsl: "glsl",
  hlsl: "hlsl",
  dot: "dot",
  conf: "bash",
  bat: "batch",
  cmd: "batch",
  fxml: "markup",
  xq: "xquery",
  xquery: "xquery",
};

export const dependencies: { [lang: string]: string | string[] } = {
  javascript: "clike",
  actionscript: "javascript",
  apex: ["clike", "sql"],
  arduino: "cpp",
  aspnet: ["markup", "csharp"],
  birb: "clike",
  bison: "c",
  c: "clike",
  csharp: "clike",
  cpp: "c",
  cfscript: "clike",
  chaiscript: ["clike", "cpp"],
  cilkc: "c",
  cilkcpp: "cpp",
  coffeescript: "javascript",
  crystal: "ruby",
  d: "clike",
  dart: "clike",
  django: "markup-templating",
  ejs: ["javascript", "markup-templating"],
  etlua: ["lua", "markup-templating"],
  erb: ["ruby", "markup-templating"],
  fsharp: "clike",
  "firestore-security-rules": "clike",
  flow: "javascript",
  ftl: "markup-templating",
  gml: "clike",
  glsl: "c",
  go: "clike",
  gradle: "clike",
  groovy: "clike",
  haml: "ruby",
  handlebars: "markup-templating",
  haxe: "clike",
  hlsl: "c",
  idris: "haskell",
  java: "clike",
  javadoc: ["markup", "java", "javadoclike"],
  jolie: "clike",
  jsdoc: ["javascript", "javadoclike", "typescript"],
  "js-extras": "javascript",
  json5: "json",
  jsonp: "json",
  "js-templates": "javascript",
  kotlin: "clike",
  latte: ["clike", "markup-templating", "php"],
  less: "css",
  lilypond: "scheme",
  liquid: "markup-templating",
  markdown: "markup",
  "markup-templating": "markup",
  mongodb: "javascript",
  n4js: "javascript",
  objectivec: "c",
  opencl: "c",
  parser: "markup",
  php: "markup-templating",
  phpdoc: ["php", "javadoclike"],
  "php-extras": "php",
  plsql: "sql",
  processing: "clike",
  protobuf: "clike",
  pug: ["markup", "javascript"],
  purebasic: "clike",
  purescript: "haskell",
  qsharp: "clike",
  qml: "javascript",
  qore: "clike",
  racket: "scheme",
  cshtml: ["markup", "csharp"],
  jsx: ["markup", "javascript"],
  tsx: ["jsx", "typescript"],
  reason: "clike",
  ruby: "clike",
  sass: "css",
  scss: "css",
  scala: "java",
  "shell-session": "bash",
  smarty: "markup-templating",
  solidity: "clike",
  soy: "markup-templating",
  sparql: "turtle",
  sqf: "clike",
  squirrel: "clike",
  stata: ["mata", "java", "python"],
  "t4-cs": ["t4-templating", "csharp"],
  "t4-vb": ["t4-templating", "vbnet"],
  tap: "yaml",
  tt2: ["clike", "markup-templating"],
  textile: "markup",
  twig: "markup-templating",
  typescript: "javascript",
  v: "clike",
  vala: "clike",
  vbnet: "basic",
  velocity: "markup",
  wiki: "markup",
  xeora: "markup",
  "xml-doc": "markup",
  xquery: "markup",
};
