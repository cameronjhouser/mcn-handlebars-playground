/**
 * Built-in sample templates demonstrating MCN Handlebars helpers.
 * Each sample has a name and a template string.
 * Data is loaded separately from the data/ folder.
 */

export const SAMPLES = [
  {
    name: '— Select a template —',
    template: '',
  },
  {
    name: 'Hello World',
    template: `<p>Hello, {{firstName}} {{lastName}}!</p>
<p>Your email is {{email}}.</p>`,
    dataFile: 'sample-basic',
  },
  {
    name: 'if / else if / else',
    template: `{{#if (compare score ">=" 90)}}
  <p>Grade: A</p>
{{else if (compare score ">=" 80)}}
  <p>Grade: B</p>
{{else if (compare score ">=" 70)}}
  <p>Grade: C</p>
{{else}}
  <p>Grade: F</p>
{{/if}}`,
    dataFile: 'sample-basic',
  },
  {
    name: 'unless',
    template: `{{#unless isLoggedIn}}
  <p>Please <a href="#">log in</a> to continue.</p>
{{else}}
  <p>Welcome back, {{firstName}}!</p>
{{/unless}}`,
    dataFile: 'sample-basic',
  },
  {
    name: 'iif (ternary)',
    template: `<p>Status: {{iif isActive "Active" "Inactive"}}</p>
<p>Greeting: {{iif (compare score ">=" 50) "Pass" "Fail"}}</p>`,
    dataFile: 'sample-basic',
  },
  {
    name: 'String: concat / uppercase / lowercase / trim',
    template: `<p>Full name: {{concat firstName " " lastName}}</p>
<p>Uppercase: {{uppercase firstName}}</p>
<p>Lowercase: {{lowercase lastName}}</p>
<p>Trimmed: "{{trim paddedText}}"</p>
<p>ProperCase: {{properCase (lowercase "MARKETING CLOUD NEXT")}}</p>`,
    dataFile: 'sample-basic',
  },
  {
    name: 'String: substring / replace / indexOf / char',
    template: `{{! substring uses 1-based indexing }}
<p>Chars 2–4 of "hello": {{substring "hello" 2 3}}</p>
<p>Replace "o" → "0": {{replace "hello world" "o" "0"}}</p>
<p>indexOf "world": {{indexOf "hello world" "world"}}</p>
<p>char(65): {{char 65}}</p>
<p>char(65602, 3): {{char 65602 3}}</p>`,
    dataFile: 'sample-basic',
  },
  {
    name: 'each (loop over list)',
    template: `<ul>
{{#each products}}
  <li>{{@index}}. {{name}} — \${{price}}
    {{#if @first}} ← first{{/if}}
    {{#if @last}} ← last{{/if}}
  </li>
{{/each}}
</ul>`,
    dataFile: 'sample-list',
  },
  {
    name: 'filter',
    template: `<h3>Products over $20:</h3>
<ul>
{{#each (filter products "price" ">" 20 "number")}}
  <li>{{name}} — \${{price}}</li>
{{/each}}
</ul>

<h3>Names containing "Pro":</h3>
<ul>
{{#each (filter products "name" "CONTAINS" "Pro" "string")}}
  <li>{{name}}</li>
{{/each}}
</ul>`,
    dataFile: 'sample-list',
  },
  {
    name: 'sort',
    template: `<h3>Products sorted by price (asc):</h3>
<ul>
{{#each (sort products "price" "asc" "number")}}
  <li>{{name}} — \${{price}}</li>
{{/each}}
</ul>

<h3>Products sorted by name (desc):</h3>
<ul>
{{#each (sort products "name" "desc" "string")}}
  <li>{{name}}</li>
{{/each}}
</ul>`,
    dataFile: 'sample-list',
  },
  {
    name: 'map / slice / flatten',
    template: `<p>All names: {{#each (map products "name")}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}</p>

<p>First 2 products (slice 0–2):</p>
<ul>
{{#each (slice products 0 2)}}
  <li>{{name}}</li>
{{/each}}
</ul>

<p>Last 2 products (slice -2):</p>
<ul>
{{#each (slice products -2)}}
  <li>{{name}}</li>
{{/each}}
</ul>

<p>Flattened tags: {{#each (flatten tagGroups)}}{{this}} {{/each}}</p>`,
    dataFile: 'sample-list',
  },
  {
    name: 'get',
    template: `<p>First product: {{get products 0}}</p>
<p>Third product name: {{get (map products "name") 2}}</p>
<p>Config value: {{get config "theme"}}</p>`,
    dataFile: 'sample-list',
  },
  {
    name: 'repeat (with @index/@first/@last)',
    template: `<ol>
{{#repeat 5}}
  <li>Item {{@index}}
    {{#if @first}}(first){{/if}}
    {{#if @last}}(last){{/if}}
  </li>
{{/repeat}}
</ol>`,
    dataFile: 'sample-basic',
  },
  {
    name: 'set (local variables)',
    template: `{{#set greeting="Hello" punctuation="!"}}
  <p>{{greeting}}, {{firstName}}{{punctuation}}</p>
  <p>Original: {{lastName}}</p>
{{/set}}

{{#set discount=0.1}}
  {{#set finalPrice=(fallback null 99.99)}}
    <p>Base: \${{score}}</p>
  {{/set}}
{{/set}}`,
    dataFile: 'sample-basic',
  },
  {
    name: 'with (context switching)',
    template: `{{#with address}}
  <p>{{street}}</p>
  <p>{{city}}, {{state}} {{zip}}</p>
  <p>Back to root: {{@root.firstName}} {{@root.lastName}}</p>
{{/with}}`,
    dataFile: 'sample-basic',
  },
  {
    name: 'fallback',
    template: `<p>Name: {{fallback nickname firstName}}</p>
<p>Email: {{fallback missingField "no-email@example.com"}}</p>
<p>Score: {{fallback score 0}}</p>`,
    dataFile: 'sample-basic',
  },
  {
    name: 'compare / equals / and / or / not',
    template: `<p>score > 50: {{compare score ">" 50}}</p>
<p>score == 85: {{equals score 85 "number"}}</p>
<p>isActive AND score > 50: {{and isActive (compare score ">" 50)}}</p>
<p>not isActive: {{not isActive}}</p>
<p>score < 0 OR score > 100: {{or (compare score "<" 0) (compare score ">" 100)}}</p>

{{#compare score ">=" 80}}
  <p>High score!</p>
{{else}}
  <p>Keep practicing.</p>
{{/compare}}`,
    dataFile: 'sample-basic',
  },
  {
    name: 'isEmpty / isNull',
    template: `<p>isEmpty(null): {{isEmpty missingField}}</p>
<p>isEmpty(""): {{isEmpty emptyString}}</p>
<p>isEmpty([]): {{isEmpty emptyList}}</p>
<p>isEmpty(products): {{isEmpty products}}</p>
<p>isNull(null): {{isNull missingField}}</p>
<p>isNull(0): {{isNull score}}</p>

{{#isEmpty nickname}}
  <p>No nickname set — using firstName: {{firstName}}</p>
{{else}}
  <p>Nickname: {{nickname}}</p>
{{/isEmpty}}`,
    dataFile: 'sample-list',
  },
  {
    name: 'format / formatCurrency / formatNumber',
    template: `<p>Date (yyyy-MM-dd): {{format orderDate "yyyy-MM-dd" "date"}}</p>
<p>Date (MMMM d, yyyy): {{format orderDate "MMMM d, yyyy" "date"}}</p>
<p>Number (N2): {{format price "N2" "numeric"}}</p>
<p>Number (F4): {{format price "F4" "numeric"}}</p>
<p>FormatCurrency: {{formatCurrency price "USD" "en-US"}}</p>
<p>FormatNumber (N0): {{formatNumber price "N0" "en-US"}}</p>`,
    dataFile: 'sample-list',
  },
  {
    name: 'now',
    template: `<p>Current time (CST): {{now}}</p>
<p>Formatted: {{format (now) "MMMM d, yyyy" "date"}}</p>`,
    dataFile: 'sample-basic',
  },
  {
    name: 'length',
    template: `<p>Length of firstName: {{length firstName}}</p>
<p>Length of products array: {{length products}}</p>
<p>Length of 12345: {{length 12345}}</p>`,
    dataFile: 'sample-list',
  },
  {
    name: 'Math: add / subtract / multiply / divide / modulo / Random',
    template: `<h3>Basic Arithmetic</h3>
<p>add(10, 5.75) = {{add 10 5.75}}</p>
<p>subtract(100, 37.5) = {{subtract 100 37.5}}</p>
<p>multiply(9.5, 2) = {{multiply 9.5 2}}</p>
<p>divide(22, 7) = {{divide 22 7}}</p>
<p>modulo(17, 5) = {{modulo 17 5}}</p>
<p>Random(1, 100) = {{Random 1 100}}</p>

<h3>Applied to Data</h3>
<p>Unit price: \${{price}}</p>
<p>Price + tax (8%): \${{multiply price 1.08}}</p>
<p>20% discount: \${{multiply price 0.8}}</p>
<p>Items / 2: {{divide (length products) 2}}</p>

<h3>Math in Conditionals</h3>
{{#if (compare (modulo score 2) "==" 0)}}
  <p>Score {{score}} is even.</p>
{{else}}
  <p>Score {{score}} is odd.</p>
{{/if}}`,
    dataFile: 'sample-list',
  },
  {
    name: 'Chained: filter → sort → map',
    template: `{{! Filter products over $20, sort by price desc, then show names }}
<h3>Premium products (>$20), sorted by price desc:</h3>
<ul>
{{#each (map (sort (filter products "price" ">" 20 "number") "price" "desc" "number") "name")}}
  <li>{{this}}</li>
{{/each}}
</ul>`,
    dataFile: 'sample-list',
  },
];
