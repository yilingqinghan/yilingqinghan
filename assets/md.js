// Tiny Markdown -> HTML converter (subset).
// Supports headings (#..), bold **, italic *, inline code ``, code fences ```,
// blockquote >, lists -, *, 1., hr ---, links [text](url), images ![], tables (simple).

export function mdToHtml(src){
  // Normalize newlines
  src = src.replace(/\r\n?/g, "\n");

  // Protect code fences first
  const fences = [];
  src = src.replace(/```([\s\S]*?)```/g, (m, code) => {
    const i = fences.push(code) - 1;
    return `\u0000FENCE${i}\u0000`;
  });

  // Block-level parsing
  const lines = src.split("\n");
  let out = "";
  let inList = false, listType = null;
  let inBlockquote = false;
  let tableBuffer = [];

  const flushList = ()=>{
    if(!inList) return;
    out += (listType === "ol" ? "</ol>" : "</ul>");
    inList = false; listType = null;
  };

  const flushBlockquote = ()=>{
    if(!inBlockquote) return;
    out += "</blockquote>";
    inBlockquote = false;
  };

  const flushTable = ()=>{
    if(tableBuffer.length === 0) return;
    const header = tableBuffer[0];
    const sep = tableBuffer[1] || "";
    const body = tableBuffer.slice(2);

    const rowToCells = (row, th=false)=>{
      return "<tr>" + row.split("|").slice(1,-1).map(c => {
        const cell = inline(c.trim());
        return th ? `<th>${cell}</th>` : `<td>${cell}</td>`;
      }).join("") + "</tr>";
    };
    out += "<table>";
    if(header) out += "<thead>" + rowToCells(header, true) + "</thead>";
    if(body.length){
      out += "<tbody>" + body.map(r => rowToCells(r, false)).join("") + "</tbody>";
    }
    out += "</table>";
    tableBuffer = [];
  };

  const isTableRow = (s)=> /^\|.*\|$/.test(s);

  const paraBuffer = [];
  const flushPara = ()=>{
    if(paraBuffer.length){
      out += "<p>" + inline(paraBuffer.join(" ").trim()) + "</p>";
      paraBuffer.length = 0;
    }
  };

  function inline(s){
    // Escape HTML
    s = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    // Images
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => `<img alt="${alt}" src="${url}">`);
    // Links
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, txt, url) => `<a href="${url}" target="_blank" rel="noopener">${txt}</a>`);
    // Bold then italic (avoid greediness)
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    // Inline code
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    return s;
  }

  for(let i=0; i<lines.length; i++){
    const line = lines[i];

    // Horizontal rule
    if (/^\s*([-*_])\1\1+/.test(line)){
      flushPara(); flushList(); flushBlockquote(); flushTable();
      out += "<hr/>"; continue;
    }

    // Table
    if(isTableRow(line)){
      flushPara(); flushList(); flushBlockquote();
      tableBuffer.push(line);
      continue;
    } else {
      flushTable();
    }

    // Headings
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if(h){
      flushPara(); flushList(); flushBlockquote();
      const level = h[1].length;
      const text = inline(h[2].trim());
      const slug = text.toLowerCase().replace(/<[^>]*>/g,"").replace(/[^\w\u4e00-\u9fa5 -]/g,"").replace(/\s+/g,"-");
      out += `<h${level} id="${slug}">${text}</h${level}>`;
      continue;
    }

    // Blockquote
    if(/^>\s?/.test(line)){
      flushPara(); flushList();
      if(!inBlockquote){ out += "<blockquote>"; inBlockquote = true; }
      out += inline(line.replace(/^>\s?/, ""));
      continue;
    } else { flushBlockquote(); }

    // Lists
    const ol = /^\s*\d+\.\s+/.exec(line);
    const ul = /^\s*[-*]\s+/.exec(line);
    if(ol || ul){
      flushPara();
      const type = ol ? "ol" : "ul";
      if(!inList){ inList = true; listType = type; out += `<${type}>`; }
      else if(listType !== type){ flushList(); inList = true; listType = type; out += `<${type}>`; }
      const item = line.replace(ol ? /^\s*\d+\.\s+/:/^\s*[-*]\s+/, "");
      out += `<li>${inline(item)}</li>`;
      continue;
    } else {
      flushList();
    }

    // Code fence placeholders handled later; paragraph accumulation
    if(line.trim() === ""){
      flushPara();
    } else {
      paraBuffer.push(line.trim());
    }
  }
  flushPara(); flushList(); flushBlockquote(); flushTable();

  // Restore fences
  out = out.replace(/\u0000FENCE(\d+)\u0000/g, (_, i) => {
    const code = fences[Number(i)].replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    return `<pre><code>${code}</code></pre>`;
  });

  return out;
}
