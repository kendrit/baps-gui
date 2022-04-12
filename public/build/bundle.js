
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.47.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/ProductTile.svelte generated by Svelte v3.47.0 */

    const file$2 = "src/ProductTile.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let h2;
    	let t0;
    	let t1;
    	let a;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			a = element("a");
    			t2 = text("VISIT");
    			add_location(h2, file$2, 6, 4, 132);
    			attr_dev(a, "href", /*url*/ ctx[1]);
    			add_location(a, file$2, 7, 4, 154);
    			attr_dev(div, "class", "product-tile-container svelte-1cu9w7w");
    			add_location(div, file$2, 5, 0, 90);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(h2, t0);
    			append_dev(div, t1);
    			append_dev(div, a);
    			append_dev(a, t2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);

    			if (dirty & /*url*/ 2) {
    				attr_dev(a, "href", /*url*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ProductTile', slots, []);
    	let { title = "A Product Title" } = $$props;
    	let { url = "" } = $$props;
    	const writable_props = ['title', 'url'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ProductTile> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('url' in $$props) $$invalidate(1, url = $$props.url);
    	};

    	$$self.$capture_state = () => ({ title, url });

    	$$self.$inject_state = $$props => {
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('url' in $$props) $$invalidate(1, url = $$props.url);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, url];
    }

    class ProductTile extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { title: 0, url: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProductTile",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get title() {
    		throw new Error("<ProductTile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<ProductTile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get url() {
    		throw new Error("<ProductTile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<ProductTile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ProductTileGrid.svelte generated by Svelte v3.47.0 */

    const { console: console_1 } = globals;
    const file$1 = "src/ProductTileGrid.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (1:0) <script>     import ProductTile from './ProductTile.svelte'     export let count = "20";     let tiles = [];     let fruits = [];     let url = 'https://www.reddit.com/r/buildapcsales.json';     let loaded = false;     let promise = [getTiles()];     async function getTiles() {         fetch(url)         .then(response => response.json())         .then(body => {             for (let index = 0; index < body.data.children.length; index++) {                 let newTile = {                     "title": body.data.children[index].data.title,                     "link":  body.data.children[index].data.url                 }
    function create_catch_block(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(1:0) <script>     import ProductTile from './ProductTile.svelte'     export let count = \\\"20\\\";     let tiles = [];     let fruits = [];     let url = 'https://www.reddit.com/r/buildapcsales.json';     let loaded = false;     let promise = [getTiles()];     async function getTiles() {         fetch(url)         .then(response => response.json())         .then(body => {             for (let index = 0; index < body.data.children.length; index++) {                 let newTile = {                     \\\"title\\\": body.data.children[index].data.title,                     \\\"link\\\":  body.data.children[index].data.url                 }",
    		ctx
    	});

    	return block;
    }

    // (28:31)          {console.log({value}
    function create_then_block(ctx) {
    	let t0_value = console.log(({ value: /*value*/ ctx[7] }).value[0]) + "";
    	let t0;
    	let t1;
    	let each_1_anchor;
    	let current;
    	let each_value = ({ value: /*value*/ ctx[7] }).value;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*promise, console*/ 1) {
    				each_value = ({ value: /*value*/ ctx[7] }).value;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(28:31)          {console.log({value}",
    		ctx
    	});

    	return block;
    }

    // (30:8) {#each {value}.value as tile}
    function create_each_block(ctx) {
    	let t0_value = console.log(/*tile*/ ctx[8]) + "";
    	let t0;
    	let t1;
    	let producttile;
    	let current;

    	producttile = new ProductTile({
    			props: {
    				title: /*tile*/ ctx[8].title,
    				url: /*tile*/ ctx[8].url
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = space();
    			create_component(producttile.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(producttile, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(producttile.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(producttile.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			destroy_component(producttile, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(30:8) {#each {value}.value as tile}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>     import ProductTile from './ProductTile.svelte'     export let count = "20";     let tiles = [];     let fruits = [];     let url = 'https://www.reddit.com/r/buildapcsales.json';     let loaded = false;     let promise = [getTiles()];     async function getTiles() {         fetch(url)         .then(response => response.json())         .then(body => {             for (let index = 0; index < body.data.children.length; index++) {                 let newTile = {                     "title": body.data.children[index].data.title,                     "link":  body.data.children[index].data.url                 }
    function create_pending_block(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(1:0) <script>     import ProductTile from './ProductTile.svelte'     export let count = \\\"20\\\";     let tiles = [];     let fruits = [];     let url = 'https://www.reddit.com/r/buildapcsales.json';     let loaded = false;     let promise = [getTiles()];     async function getTiles() {         fetch(url)         .then(response => response.json())         .then(body => {             for (let index = 0; index < body.data.children.length; index++) {                 let newTile = {                     \\\"title\\\": body.data.children[index].data.title,                     \\\"link\\\":  body.data.children[index].data.url                 }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let producttile;
    	let t;
    	let current;
    	producttile = new ProductTile({ $$inline: true });

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 7,
    		blocks: [,,,]
    	};

    	handle_promise(/*promise*/ ctx[0], info);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(producttile.$$.fragment);
    			t = space();
    			info.block.c();
    			attr_dev(div, "class", "grid-container");
    			add_location(div, file$1, 25, 0, 754);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(producttile, div, null);
    			append_dev(div, t);
    			info.block.m(div, info.anchor = null);
    			info.mount = () => div;
    			info.anchor = null;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			update_await_block_branch(info, ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(producttile.$$.fragment, local);
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(producttile.$$.fragment, local);

    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(producttile);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ProductTileGrid', slots, []);
    	let { count = "20" } = $$props;
    	let tiles = [];
    	let fruits = [];
    	let url = 'https://www.reddit.com/r/buildapcsales.json';
    	let loaded = false;
    	let promise = [getTiles()];

    	async function getTiles() {
    		fetch(url).then(response => response.json()).then(body => {
    			for (let index = 0; index < body.data.children.length; index++) {
    				let newTile = {
    					"title": body.data.children[index].data.title,
    					"link": body.data.children[index].data.url
    				};

    				tiles.push(newTile);
    			}
    		});

    		console.log(tiles);
    		return tiles;
    	}

    	const writable_props = ['count'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<ProductTileGrid> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('count' in $$props) $$invalidate(1, count = $$props.count);
    	};

    	$$self.$capture_state = () => ({
    		ProductTile,
    		count,
    		tiles,
    		fruits,
    		url,
    		loaded,
    		promise,
    		getTiles
    	});

    	$$self.$inject_state = $$props => {
    		if ('count' in $$props) $$invalidate(1, count = $$props.count);
    		if ('tiles' in $$props) tiles = $$props.tiles;
    		if ('fruits' in $$props) fruits = $$props.fruits;
    		if ('url' in $$props) url = $$props.url;
    		if ('loaded' in $$props) loaded = $$props.loaded;
    		if ('promise' in $$props) $$invalidate(0, promise = $$props.promise);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [promise, count];
    }

    class ProductTileGrid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { count: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProductTileGrid",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get count() {
    		throw new Error("<ProductTileGrid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set count(value) {
    		throw new Error("<ProductTileGrid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.47.0 */
    const file = "src/App.svelte";

    // (36:1) {#if editing}
    function create_if_block(ctx) {
    	let div;
    	let input;
    	let t0;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			button = element("button");
    			button.textContent = "SAVE";
    			attr_dev(input, "type", "text");
    			add_location(input, file, 37, 3, 914);
    			add_location(button, file, 38, 3, 962);
    			attr_dev(div, "class", "api-key header svelte-1t3nibc");
    			add_location(div, file, 36, 2, 882);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			set_input_value(input, /*tempapikey*/ ctx[1]);
    			append_dev(div, t0);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[8]),
    					listen_dev(button, "click", /*saveApiKey*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*tempapikey*/ 2 && input.value !== /*tempapikey*/ ctx[1]) {
    				set_input_value(input, /*tempapikey*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(36:1) {#if editing}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let strong0;
    	let t1;
    	let div;
    	let h20;
    	let t2;
    	let strong1;
    	let t4;
    	let h3;
    	let strong2;
    	let t6_value = (/*showKey*/ ctx[2] ? /*apikey*/ ctx[0] : " ") + "";
    	let t6;
    	let t7;
    	let button0;
    	let t8_value = (/*showKey*/ ctx[2] ? "HIDE" : "SHOW") + "";
    	let t8;
    	let button0_hidden_value;
    	let t9;
    	let button1;
    	let t11;
    	let t12;
    	let h21;
    	let t14;
    	let producttilegrid;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*editing*/ ctx[3] && create_if_block(ctx);
    	producttilegrid = new ProductTileGrid({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			strong0 = element("strong");
    			strong0.textContent = "BAPS-GUI";
    			t1 = space();
    			div = element("div");
    			h20 = element("h2");
    			t2 = text("A GUI FOR ");
    			strong1 = element("strong");
    			strong1.textContent = "r/BUILDAPCSALES";
    			t4 = space();
    			h3 = element("h3");
    			strong2 = element("strong");
    			strong2.textContent = "Your current API key: ";
    			t6 = text(t6_value);
    			t7 = space();
    			button0 = element("button");
    			t8 = text(t8_value);
    			t9 = space();
    			button1 = element("button");
    			button1.textContent = "EDIT";
    			t11 = space();
    			if (if_block) if_block.c();
    			t12 = space();
    			h21 = element("h2");
    			h21.textContent = "AVAILABLE PRODUCTS:";
    			t14 = space();
    			create_component(producttilegrid.$$.fragment);
    			add_location(strong0, file, 25, 20, 486);
    			attr_dev(h1, "class", "header svelte-1t3nibc");
    			add_location(h1, file, 25, 1, 467);
    			add_location(strong1, file, 27, 41, 590);
    			attr_dev(h20, "class", "header subheader svelte-1t3nibc");
    			add_location(h20, file, 27, 2, 551);
    			add_location(strong2, file, 29, 3, 638);
    			button0.hidden = button0_hidden_value = !/*apikey*/ ctx[0];
    			add_location(button0, file, 31, 4, 712);
    			add_location(button1, file, 32, 3, 805);
    			attr_dev(h3, "class", "svelte-1t3nibc");
    			add_location(h3, file, 28, 2, 630);
    			attr_dev(div, "class", "header subheader svelte-1t3nibc");
    			add_location(div, file, 26, 1, 518);
    			attr_dev(h21, "class", "header svelte-1t3nibc");
    			add_location(h21, file, 41, 1, 1023);
    			attr_dev(main, "class", "svelte-1t3nibc");
    			add_location(main, file, 24, 0, 459);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(h1, strong0);
    			append_dev(main, t1);
    			append_dev(main, div);
    			append_dev(div, h20);
    			append_dev(h20, t2);
    			append_dev(h20, strong1);
    			append_dev(div, t4);
    			append_dev(div, h3);
    			append_dev(h3, strong2);
    			append_dev(h3, t6);
    			append_dev(h3, t7);
    			append_dev(h3, button0);
    			append_dev(button0, t8);
    			append_dev(h3, t9);
    			append_dev(h3, button1);
    			append_dev(main, t11);
    			if (if_block) if_block.m(main, null);
    			append_dev(main, t12);
    			append_dev(main, h21);
    			append_dev(main, t14);
    			mount_component(producttilegrid, main, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*showOrHideApiKey*/ ctx[6], false, false, false),
    					listen_dev(button1, "click", /*editApiKey*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*showKey, apikey*/ 5) && t6_value !== (t6_value = (/*showKey*/ ctx[2] ? /*apikey*/ ctx[0] : " ") + "")) set_data_dev(t6, t6_value);
    			if ((!current || dirty & /*showKey*/ 4) && t8_value !== (t8_value = (/*showKey*/ ctx[2] ? "HIDE" : "SHOW") + "")) set_data_dev(t8, t8_value);

    			if (!current || dirty & /*apikey*/ 1 && button0_hidden_value !== (button0_hidden_value = !/*apikey*/ ctx[0])) {
    				prop_dev(button0, "hidden", button0_hidden_value);
    			}

    			if (/*editing*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(main, t12);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(producttilegrid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(producttilegrid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    			destroy_component(producttilegrid);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function loadProductTiles() {
    	return;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { name } = $$props;
    	let { apikey } = $$props;
    	let tempapikey;
    	let showKey = false;
    	let editing = false;

    	function saveApiKey() {
    		$$invalidate(2, showKey = true);
    		$$invalidate(3, editing = false);
    		$$invalidate(0, apikey = tempapikey);
    	}

    	function editApiKey() {
    		$$invalidate(3, editing = true);
    	}

    	function showOrHideApiKey() {
    		$$invalidate(2, showKey = !showKey);
    	}

    	const writable_props = ['name', 'apikey'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		tempapikey = this.value;
    		$$invalidate(1, tempapikey);
    	}

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(7, name = $$props.name);
    		if ('apikey' in $$props) $$invalidate(0, apikey = $$props.apikey);
    	};

    	$$self.$capture_state = () => ({
    		ProductTile,
    		ProductTileGrid,
    		name,
    		apikey,
    		tempapikey,
    		showKey,
    		editing,
    		saveApiKey,
    		editApiKey,
    		showOrHideApiKey,
    		loadProductTiles
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(7, name = $$props.name);
    		if ('apikey' in $$props) $$invalidate(0, apikey = $$props.apikey);
    		if ('tempapikey' in $$props) $$invalidate(1, tempapikey = $$props.tempapikey);
    		if ('showKey' in $$props) $$invalidate(2, showKey = $$props.showKey);
    		if ('editing' in $$props) $$invalidate(3, editing = $$props.editing);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		apikey,
    		tempapikey,
    		showKey,
    		editing,
    		saveApiKey,
    		editApiKey,
    		showOrHideApiKey,
    		name,
    		input_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 7, apikey: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[7] === undefined && !('name' in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}

    		if (/*apikey*/ ctx[0] === undefined && !('apikey' in props)) {
    			console.warn("<App> was created without expected prop 'apikey'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get apikey() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set apikey(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
