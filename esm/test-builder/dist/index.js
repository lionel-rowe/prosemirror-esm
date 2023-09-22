import { schema as schema$1 } from "../../schema-basic/dist/index.js";
import { addListNodes } from "../../schema-list/dist/index.js";
import { Node, Schema } from "../../model/dist/index.js";

const noTag = Node.prototype.tag = Object.create(null);
function flatten(schema, children, f) {
    let result = [], pos = 0, tag = noTag;
    for (let i = 0; i < children.length; i++) {
        let child = children[i];
        if (typeof child == "string") {
            let re = /<(\w+)>/g, m, at = 0, out = "";
            while (m = re.exec(child)) {
                out += child.slice(at, m.index);
                pos += m.index - at;
                at = m.index + m[0].length;
                if (tag == noTag)
                    tag = Object.create(null);
                tag[m[1]] = pos;
            }
            out += child.slice(at);
            pos += child.length - at;
            if (out)
                result.push(f(schema.text(out)));
        }
        else {
            if (child.tag && child.tag != Node.prototype.tag) {
                if (tag == noTag)
                    tag = Object.create(null);
                for (let id in child.tag)
                    tag[id] = child.tag[id] + (child.flat || child.isText ? 0 : 1) + pos;
            }
            if (child.flat) {
                for (let j = 0; j < child.flat.length; j++) {
                    let node = f(child.flat[j]);
                    pos += node.nodeSize;
                    result.push(node);
                }
            }
            else {
                let node = f(child);
                pos += node.nodeSize;
                result.push(node);
            }
        }
    }
    return { nodes: result, tag };
}
function id(x) { return x; }
function takeAttrs(attrs, args) {
    let a0 = args[0];
    if (!args.length || (a0 && (typeof a0 == "string" || a0 instanceof Node || a0.flat)))
        return attrs;
    args.shift();
    if (!attrs)
        return a0;
    if (!a0)
        return attrs;
    let result = {};
    for (let prop in attrs)
        result[prop] = attrs[prop];
    for (let prop in a0)
        result[prop] = a0[prop];
    return result;
}
/**
Create a builder function for nodes with content.
*/
function block(type, attrs = null) {
    let result = function (...args) {
        let myAttrs = takeAttrs(attrs, args);
        let { nodes, tag } = flatten(type.schema, args, id);
        let node = type.create(myAttrs, nodes);
        if (tag != noTag)
            node.tag = tag;
        return node;
    };
    if (type.isLeaf)
        try {
            result.flat = [type.create(attrs)];
        }
        catch (_) { }
    return result;
}
// Create a builder function for marks.
function mark(type, attrs) {
    return function (...args) {
        let mark = type.create(takeAttrs(attrs, args));
        let { nodes, tag } = flatten(type.schema, args, n => {
            let newMarks = mark.addToSet(n.marks);
            return newMarks.length > n.marks.length ? n.mark(newMarks) : n;
        });
        return { flat: nodes, tag };
    };
}
function builders(schema, names) {
    let result = { schema };
    for (let name in schema.nodes)
        result[name] = block(schema.nodes[name], {});
    for (let name in schema.marks)
        result[name] = mark(schema.marks[name], {});
    if (names)
        for (let name in names) {
            let value = names[name], typeName = value.nodeType || value.markType || name, type;
            if (type = schema.nodes[typeName])
                result[name] = block(type, value);
            else if (type = schema.marks[typeName])
                result[name] = mark(type, value);
        }
    return result;
}

const schema = new Schema({
    nodes: addListNodes(schema$1.spec.nodes, "paragraph block*", "block"),
    marks: schema$1.spec.marks
});
let b = builders(schema, {
    p: { nodeType: "paragraph" },
    pre: { nodeType: "code_block" },
    h1: { nodeType: "heading", level: 1 },
    h2: { nodeType: "heading", level: 2 },
    h3: { nodeType: "heading", level: 3 },
    li: { nodeType: "list_item" },
    ul: { nodeType: "bullet_list" },
    ol: { nodeType: "ordered_list" },
    br: { nodeType: "hard_break" },
    img: { nodeType: "image", src: "img.png" },
    hr: { nodeType: "horizontal_rule" },
    a: { markType: "link", href: "foo" },
});
function eq(a, b) { return a.eq(b); }
const doc = b.doc;
const p = b.p;
const code_block = b.code_block;
const pre = b.pre;
const h1 = b.h1;
const h2 = b.h2;
const h3 = b.h3;
const li = b.li;
const ul = b.ul;
const ol = b.ol;
const img = b.img;
const hr = b.hr;
const br = b.br;
const blockquote = b.blockquote;
const a = b.a;
const em = b.em;
const strong = b.strong;
const code = b.code;

export { a, blockquote, br, builders, code, code_block, doc, em, eq, h1, h2, h3, hr, img, li, ol, p, pre, schema, strong, ul };
