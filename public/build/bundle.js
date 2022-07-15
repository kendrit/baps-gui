
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
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
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
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
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
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

    class Tile {
        constructor(data, title, url, post_url) {
            this.data = data;
            this.title = title;
            this.url = url;
            this.post_url = post_url;
        }
    }

    /* src/ProductTile.svelte generated by Svelte v3.47.0 */

    const { console: console_1 } = globals;
    const file$3 = "src/ProductTile.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let h2;
    	let t0;
    	let t1;
    	let a0;
    	let t2;
    	let t3;
    	let br;
    	let t4;
    	let a1;
    	let t5;
    	let a1_href_value;
    	let t6;
    	let h4;
    	let t7_value = (/*data*/ ctx[0] ? /*data*/ ctx[0].domain : "") + "";
    	let t7;
    	let t8;
    	let img;
    	let img_src_value;
    	let img_alt_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			t0 = text(/*title*/ ctx[1]);
    			t1 = space();
    			a0 = element("a");
    			t2 = text("PRODUCT LINK");
    			t3 = space();
    			br = element("br");
    			t4 = space();
    			a1 = element("a");
    			t5 = text("VISIT ORIGINAL POST");
    			t6 = space();
    			h4 = element("h4");
    			t7 = text(t7_value);
    			t8 = space();
    			img = element("img");
    			add_location(h2, file$3, 11, 4, 300);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "href", /*url*/ ctx[2]);
    			add_location(a0, file$3, 12, 4, 322);
    			add_location(br, file$3, 13, 4, 374);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "href", a1_href_value = "https://www.reddit.com" + /*post_url*/ ctx[3]);
    			add_location(a1, file$3, 14, 4, 385);
    			add_location(h4, file$3, 15, 4, 473);

    			if (!src_url_equal(img.src, img_src_value = /*data*/ ctx[0]
    			? "https://" + /*data*/ ctx[0].domain + "/favicon.ico"
    			: "")) attr_dev(img, "src", img_src_value);

    			attr_dev(img, "alt", img_alt_value = /*data*/ ctx[0]
    			? /*data*/ ctx[0].domain + " logo"
    			: "undefined logo");

    			add_location(img, file$3, 16, 4, 513);
    			attr_dev(div, "class", "product-tile-container svelte-w21rjt");
    			add_location(div, file$3, 10, 0, 258);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(h2, t0);
    			append_dev(div, t1);
    			append_dev(div, a0);
    			append_dev(a0, t2);
    			append_dev(div, t3);
    			append_dev(div, br);
    			append_dev(div, t4);
    			append_dev(div, a1);
    			append_dev(a1, t5);
    			append_dev(div, t6);
    			append_dev(div, h4);
    			append_dev(h4, t7);
    			append_dev(div, t8);
    			append_dev(div, img);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 2) set_data_dev(t0, /*title*/ ctx[1]);

    			if (dirty & /*url*/ 4) {
    				attr_dev(a0, "href", /*url*/ ctx[2]);
    			}

    			if (dirty & /*post_url*/ 8 && a1_href_value !== (a1_href_value = "https://www.reddit.com" + /*post_url*/ ctx[3])) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*data*/ 1 && t7_value !== (t7_value = (/*data*/ ctx[0] ? /*data*/ ctx[0].domain : "") + "")) set_data_dev(t7, t7_value);

    			if (dirty & /*data*/ 1 && !src_url_equal(img.src, img_src_value = /*data*/ ctx[0]
    			? "https://" + /*data*/ ctx[0].domain + "/favicon.ico"
    			: "")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*data*/ 1 && img_alt_value !== (img_alt_value = /*data*/ ctx[0]
    			? /*data*/ ctx[0].domain + " logo"
    			: "undefined logo")) {
    				attr_dev(img, "alt", img_alt_value);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ProductTile', slots, []);
    	let { tile = new Tile() } = $$props;
    	let { data = tile.data } = $$props;
    	let { title = tile.title } = $$props;
    	let { url = tile.url } = $$props;
    	let { post_url = tile.post_url } = $$props;
    	console.log(tile);
    	const writable_props = ['tile', 'data', 'title', 'url', 'post_url'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<ProductTile> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('tile' in $$props) $$invalidate(4, tile = $$props.tile);
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('url' in $$props) $$invalidate(2, url = $$props.url);
    		if ('post_url' in $$props) $$invalidate(3, post_url = $$props.post_url);
    	};

    	$$self.$capture_state = () => ({ Tile, tile, data, title, url, post_url });

    	$$self.$inject_state = $$props => {
    		if ('tile' in $$props) $$invalidate(4, tile = $$props.tile);
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('url' in $$props) $$invalidate(2, url = $$props.url);
    		if ('post_url' in $$props) $$invalidate(3, post_url = $$props.post_url);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, title, url, post_url, tile];
    }

    class ProductTile extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			tile: 4,
    			data: 0,
    			title: 1,
    			url: 2,
    			post_url: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProductTile",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get tile() {
    		throw new Error("<ProductTile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tile(value) {
    		throw new Error("<ProductTile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<ProductTile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<ProductTile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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

    	get post_url() {
    		throw new Error("<ProductTile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set post_url(value) {
    		throw new Error("<ProductTile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ProductTileGrid.svelte generated by Svelte v3.47.0 */
    const file$2 = "src/ProductTileGrid.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (46:8) {:else}
    function create_else_block$1(ctx) {
    	let label;
    	let input;
    	let t0;
    	let t1_value = /*filter*/ ctx[11][0] + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "type", "checkbox");
    			add_location(input, file$2, 47, 12, 1639);
    			add_location(label, file$2, 46, 8, 1619);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			append_dev(label, t0);
    			append_dev(label, t1);
    			append_dev(label, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(46:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (41:8) {#if filter[1]}
    function create_if_block$1(ctx) {
    	let label;
    	let input;
    	let t0;
    	let t1_value = /*filter*/ ctx[11][0] + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "type", "checkbox");
    			input.checked = true;
    			add_location(input, file$2, 42, 12, 1522);
    			add_location(label, file$2, 41, 8, 1502);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			append_dev(label, t0);
    			append_dev(label, t1);
    			append_dev(label, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(41:8) {#if filter[1]}",
    		ctx
    	});

    	return block;
    }

    // (40:4) {#each filters as filter}
    function create_each_block_1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*filter*/ ctx[11][1]) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(40:4) {#each filters as filter}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>     import ProductTile from './ProductTile.svelte'     import Tile from './tile.js'     let tiles = [];     let filters = [];     let omittedFilters = ["Expired"];     let flairs = ["Meta", "Mod Post", "CPU", "Prebuilt", "GPU", "SSD - M.2", "Case", "Expired", "Printer", "Monitor", "Keyboard", "Headphones", "PSU"]     for (let i = 0; i < flairs.length; i++) {         filters.push([flairs[i], !(omittedFilters.includes(flairs[i]))]);     }
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
    		source: "(1:0) <script>     import ProductTile from './ProductTile.svelte'     import Tile from './tile.js'     let tiles = [];     let filters = [];     let omittedFilters = [\\\"Expired\\\"];     let flairs = [\\\"Meta\\\", \\\"Mod Post\\\", \\\"CPU\\\", \\\"Prebuilt\\\", \\\"GPU\\\", \\\"SSD - M.2\\\", \\\"Case\\\", \\\"Expired\\\", \\\"Printer\\\", \\\"Monitor\\\", \\\"Keyboard\\\", \\\"Headphones\\\", \\\"PSU\\\"]     for (let i = 0; i < flairs.length; i++) {         filters.push([flairs[i], !(omittedFilters.includes(flairs[i]))]);     }",
    		ctx
    	});

    	return block;
    }

    // (58:4) {:then tilees}
    function create_then_block(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*tilees*/ ctx[7];
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
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*promise*/ 2) {
    				each_value = /*tilees*/ ctx[7];
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
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(58:4) {:then tilees}",
    		ctx
    	});

    	return block;
    }

    // (59:8) {#each tilees as tilee}
    function create_each_block(ctx) {
    	let producttile;
    	let current;

    	producttile = new ProductTile({
    			props: { tile: /*tilee*/ ctx[8] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(producttile.$$.fragment);
    		},
    		m: function mount(target, anchor) {
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
    			destroy_component(producttile, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(59:8) {#each tilees as tilee}",
    		ctx
    	});

    	return block;
    }

    // (56:20)      <ProductTile />     {:then tilees}
    function create_pending_block(ctx) {
    	let producttile;
    	let current;
    	producttile = new ProductTile({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(producttile.$$.fragment);
    		},
    		m: function mount(target, anchor) {
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
    			destroy_component(producttile, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(56:20)      <ProductTile />     {:then tilees}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div0;
    	let t;
    	let div1;
    	let current;
    	let each_value_1 = /*filters*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

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

    	handle_promise(/*promise*/ ctx[1], info);

    	const block = {
    		c: function create() {
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			div1 = element("div");
    			info.block.c();
    			attr_dev(div0, "class", "filter-container svelte-1ek4ay2");
    			add_location(div0, file$2, 38, 0, 1409);
    			attr_dev(div1, "class", "grid-container svelte-1ek4ay2");
    			add_location(div1, file$2, 54, 0, 1738);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);
    			info.block.m(div1, info.anchor = null);
    			info.mount = () => div1;
    			info.anchor = null;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*filters*/ 1) {
    				each_value_1 = /*filters*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			update_await_block_branch(info, ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    			info.block.d();
    			info.token = null;
    			info = null;
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

    function filterPost(data, filters) {
    	if (filters.includes(data.link_flair_css_class)) {
    		return false;
    	} else {
    		return true;
    	}
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ProductTileGrid', slots, []);
    	let tiles = [];
    	let filters = [];
    	let omittedFilters = ["Expired"];

    	let flairs = [
    		"Meta",
    		"Mod Post",
    		"CPU",
    		"Prebuilt",
    		"GPU",
    		"SSD - M.2",
    		"Case",
    		"Expired",
    		"Printer",
    		"Monitor",
    		"Keyboard",
    		"Headphones",
    		"PSU"
    	];

    	for (let i = 0; i < flairs.length; i++) {
    		filters.push([flairs[i], !omittedFilters.includes(flairs[i])]);
    	}

    	let url = 'https://www.reddit.com/r/buildapcsales.json';
    	let promise = getTiles();

    	async function getTiles() {
    		await fetch(url).then(response => response.json()).then(body => {
    			for (let index = 0; index < body.data.children.length; index++) {
    				let data = body.data.children[index].data;
    				let _title = data.title;
    				let _url = data.url;
    				let _purl = data.permalink;

    				if (filterPost(data, filters)) {
    					let newTile = new Tile(data, _title, _url, _purl);
    					tiles.push(newTile);
    				}
    			} // console.log(body.data.children[index]);
    		});

    		return tiles;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ProductTileGrid> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		ProductTile,
    		Tile,
    		tiles,
    		filters,
    		omittedFilters,
    		flairs,
    		url,
    		promise,
    		filterPost,
    		getTiles
    	});

    	$$self.$inject_state = $$props => {
    		if ('tiles' in $$props) tiles = $$props.tiles;
    		if ('filters' in $$props) $$invalidate(0, filters = $$props.filters);
    		if ('omittedFilters' in $$props) omittedFilters = $$props.omittedFilters;
    		if ('flairs' in $$props) flairs = $$props.flairs;
    		if ('url' in $$props) url = $$props.url;
    		if ('promise' in $$props) $$invalidate(1, promise = $$props.promise);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [filters, promise];
    }

    class ProductTileGrid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProductTileGrid",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const parseNumber = parseFloat;

    function joinCss(obj, separator = ';') {
      let texts;
      if (Array.isArray(obj)) {
        texts = obj.filter((text) => text);
      } else {
        texts = [];
        for (const prop in obj) {
          if (obj[prop]) {
            texts.push(`${prop}:${obj[prop]}`);
          }
        }
      }
      return texts.join(separator);
    }

    function getStyles(style, size, pull, fw) {
      let float;
      let width;
      const height = '1em';
      let lineHeight;
      let fontSize;
      let textAlign;
      let verticalAlign = '-.125em';
      const overflow = 'visible';

      if (fw) {
        textAlign = 'center';
        width = '1.25em';
      }

      if (pull) {
        float = pull;
      }

      if (size) {
        if (size == 'lg') {
          fontSize = '1.33333em';
          lineHeight = '.75em';
          verticalAlign = '-.225em';
        } else if (size == 'xs') {
          fontSize = '.75em';
        } else if (size == 'sm') {
          fontSize = '.875em';
        } else {
          fontSize = size.replace('x', 'em');
        }
      }

      return joinCss([
        joinCss({
          float,
          width,
          height,
          'line-height': lineHeight,
          'font-size': fontSize,
          'text-align': textAlign,
          'vertical-align': verticalAlign,
          'transform-origin': 'center',
          overflow,
        }),
        style,
      ]);
    }

    function getTransform(
      scale,
      translateX,
      translateY,
      rotate,
      flip,
      translateTimes = 1,
      translateUnit = '',
      rotateUnit = '',
    ) {
      let flipX = 1;
      let flipY = 1;

      if (flip) {
        if (flip == 'horizontal') {
          flipX = -1;
        } else if (flip == 'vertical') {
          flipY = -1;
        } else {
          flipX = flipY = -1;
        }
      }

      return joinCss(
        [
          `translate(${parseNumber(translateX) * translateTimes}${translateUnit},${parseNumber(translateY) * translateTimes}${translateUnit})`,
          `scale(${flipX * parseNumber(scale)},${flipY * parseNumber(scale)})`,
          rotate && `rotate(${rotate}${rotateUnit})`,
        ],
        ' ',
      );
    }

    /* node_modules/svelte-fa/src/fa.svelte generated by Svelte v3.47.0 */
    const file$1 = "node_modules/svelte-fa/src/fa.svelte";

    // (66:0) {#if i[4]}
    function create_if_block(ctx) {
    	let svg;
    	let g1;
    	let g0;
    	let g1_transform_value;
    	let g1_transform_origin_value;
    	let svg_id_value;
    	let svg_class_value;
    	let svg_viewBox_value;

    	function select_block_type(ctx, dirty) {
    		if (typeof /*i*/ ctx[10][4] == 'string') return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g1 = svg_element("g");
    			g0 = svg_element("g");
    			if_block.c();
    			attr_dev(g0, "transform", /*transform*/ ctx[12]);
    			add_location(g0, file$1, 81, 6, 1397);
    			attr_dev(g1, "transform", g1_transform_value = "translate(" + /*i*/ ctx[10][0] / 2 + " " + /*i*/ ctx[10][1] / 2 + ")");
    			attr_dev(g1, "transform-origin", g1_transform_origin_value = "" + (/*i*/ ctx[10][0] / 4 + " 0"));
    			add_location(g1, file$1, 77, 4, 1293);
    			attr_dev(svg, "id", svg_id_value = /*id*/ ctx[1] || undefined);
    			attr_dev(svg, "class", svg_class_value = "svelte-fa " + /*clazz*/ ctx[0] + " svelte-1cj2gr0");
    			attr_dev(svg, "style", /*s*/ ctx[11]);
    			attr_dev(svg, "viewBox", svg_viewBox_value = "0 0 " + /*i*/ ctx[10][0] + " " + /*i*/ ctx[10][1]);
    			attr_dev(svg, "aria-hidden", "true");
    			attr_dev(svg, "role", "img");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			toggle_class(svg, "pulse", /*pulse*/ ctx[4]);
    			toggle_class(svg, "spin", /*spin*/ ctx[3]);
    			add_location(svg, file$1, 66, 2, 1071);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g1);
    			append_dev(g1, g0);
    			if_block.m(g0, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(g0, null);
    				}
    			}

    			if (dirty & /*transform*/ 4096) {
    				attr_dev(g0, "transform", /*transform*/ ctx[12]);
    			}

    			if (dirty & /*i*/ 1024 && g1_transform_value !== (g1_transform_value = "translate(" + /*i*/ ctx[10][0] / 2 + " " + /*i*/ ctx[10][1] / 2 + ")")) {
    				attr_dev(g1, "transform", g1_transform_value);
    			}

    			if (dirty & /*i*/ 1024 && g1_transform_origin_value !== (g1_transform_origin_value = "" + (/*i*/ ctx[10][0] / 4 + " 0"))) {
    				attr_dev(g1, "transform-origin", g1_transform_origin_value);
    			}

    			if (dirty & /*id*/ 2 && svg_id_value !== (svg_id_value = /*id*/ ctx[1] || undefined)) {
    				attr_dev(svg, "id", svg_id_value);
    			}

    			if (dirty & /*clazz*/ 1 && svg_class_value !== (svg_class_value = "svelte-fa " + /*clazz*/ ctx[0] + " svelte-1cj2gr0")) {
    				attr_dev(svg, "class", svg_class_value);
    			}

    			if (dirty & /*s*/ 2048) {
    				attr_dev(svg, "style", /*s*/ ctx[11]);
    			}

    			if (dirty & /*i*/ 1024 && svg_viewBox_value !== (svg_viewBox_value = "0 0 " + /*i*/ ctx[10][0] + " " + /*i*/ ctx[10][1])) {
    				attr_dev(svg, "viewBox", svg_viewBox_value);
    			}

    			if (dirty & /*clazz, pulse*/ 17) {
    				toggle_class(svg, "pulse", /*pulse*/ ctx[4]);
    			}

    			if (dirty & /*clazz, spin*/ 9) {
    				toggle_class(svg, "spin", /*spin*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(66:0) {#if i[4]}",
    		ctx
    	});

    	return block;
    }

    // (89:8) {:else}
    function create_else_block(ctx) {
    	let path0;
    	let path0_d_value;
    	let path0_fill_value;
    	let path0_fill_opacity_value;
    	let path0_transform_value;
    	let path1;
    	let path1_d_value;
    	let path1_fill_value;
    	let path1_fill_opacity_value;
    	let path1_transform_value;

    	const block = {
    		c: function create() {
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "d", path0_d_value = /*i*/ ctx[10][4][0]);
    			attr_dev(path0, "fill", path0_fill_value = /*secondaryColor*/ ctx[6] || /*color*/ ctx[2] || 'currentColor');

    			attr_dev(path0, "fill-opacity", path0_fill_opacity_value = /*swapOpacity*/ ctx[9] != false
    			? /*primaryOpacity*/ ctx[7]
    			: /*secondaryOpacity*/ ctx[8]);

    			attr_dev(path0, "transform", path0_transform_value = "translate(" + /*i*/ ctx[10][0] / -2 + " " + /*i*/ ctx[10][1] / -2 + ")");
    			add_location(path0, file$1, 90, 10, 1678);
    			attr_dev(path1, "d", path1_d_value = /*i*/ ctx[10][4][1]);
    			attr_dev(path1, "fill", path1_fill_value = /*primaryColor*/ ctx[5] || /*color*/ ctx[2] || 'currentColor');

    			attr_dev(path1, "fill-opacity", path1_fill_opacity_value = /*swapOpacity*/ ctx[9] != false
    			? /*secondaryOpacity*/ ctx[8]
    			: /*primaryOpacity*/ ctx[7]);

    			attr_dev(path1, "transform", path1_transform_value = "translate(" + /*i*/ ctx[10][0] / -2 + " " + /*i*/ ctx[10][1] / -2 + ")");
    			add_location(path1, file$1, 96, 10, 1935);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path0, anchor);
    			insert_dev(target, path1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*i*/ 1024 && path0_d_value !== (path0_d_value = /*i*/ ctx[10][4][0])) {
    				attr_dev(path0, "d", path0_d_value);
    			}

    			if (dirty & /*secondaryColor, color*/ 68 && path0_fill_value !== (path0_fill_value = /*secondaryColor*/ ctx[6] || /*color*/ ctx[2] || 'currentColor')) {
    				attr_dev(path0, "fill", path0_fill_value);
    			}

    			if (dirty & /*swapOpacity, primaryOpacity, secondaryOpacity*/ 896 && path0_fill_opacity_value !== (path0_fill_opacity_value = /*swapOpacity*/ ctx[9] != false
    			? /*primaryOpacity*/ ctx[7]
    			: /*secondaryOpacity*/ ctx[8])) {
    				attr_dev(path0, "fill-opacity", path0_fill_opacity_value);
    			}

    			if (dirty & /*i*/ 1024 && path0_transform_value !== (path0_transform_value = "translate(" + /*i*/ ctx[10][0] / -2 + " " + /*i*/ ctx[10][1] / -2 + ")")) {
    				attr_dev(path0, "transform", path0_transform_value);
    			}

    			if (dirty & /*i*/ 1024 && path1_d_value !== (path1_d_value = /*i*/ ctx[10][4][1])) {
    				attr_dev(path1, "d", path1_d_value);
    			}

    			if (dirty & /*primaryColor, color*/ 36 && path1_fill_value !== (path1_fill_value = /*primaryColor*/ ctx[5] || /*color*/ ctx[2] || 'currentColor')) {
    				attr_dev(path1, "fill", path1_fill_value);
    			}

    			if (dirty & /*swapOpacity, secondaryOpacity, primaryOpacity*/ 896 && path1_fill_opacity_value !== (path1_fill_opacity_value = /*swapOpacity*/ ctx[9] != false
    			? /*secondaryOpacity*/ ctx[8]
    			: /*primaryOpacity*/ ctx[7])) {
    				attr_dev(path1, "fill-opacity", path1_fill_opacity_value);
    			}

    			if (dirty & /*i*/ 1024 && path1_transform_value !== (path1_transform_value = "translate(" + /*i*/ ctx[10][0] / -2 + " " + /*i*/ ctx[10][1] / -2 + ")")) {
    				attr_dev(path1, "transform", path1_transform_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path0);
    			if (detaching) detach_dev(path1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(89:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (83:8) {#if typeof i[4] == 'string'}
    function create_if_block_1(ctx) {
    	let path;
    	let path_d_value;
    	let path_fill_value;
    	let path_transform_value;

    	const block = {
    		c: function create() {
    			path = svg_element("path");
    			attr_dev(path, "d", path_d_value = /*i*/ ctx[10][4]);
    			attr_dev(path, "fill", path_fill_value = /*color*/ ctx[2] || /*primaryColor*/ ctx[5] || 'currentColor');
    			attr_dev(path, "transform", path_transform_value = "translate(" + /*i*/ ctx[10][0] / -2 + " " + /*i*/ ctx[10][1] / -2 + ")");
    			add_location(path, file$1, 83, 10, 1461);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*i*/ 1024 && path_d_value !== (path_d_value = /*i*/ ctx[10][4])) {
    				attr_dev(path, "d", path_d_value);
    			}

    			if (dirty & /*color, primaryColor*/ 36 && path_fill_value !== (path_fill_value = /*color*/ ctx[2] || /*primaryColor*/ ctx[5] || 'currentColor')) {
    				attr_dev(path, "fill", path_fill_value);
    			}

    			if (dirty & /*i*/ 1024 && path_transform_value !== (path_transform_value = "translate(" + /*i*/ ctx[10][0] / -2 + " " + /*i*/ ctx[10][1] / -2 + ")")) {
    				attr_dev(path, "transform", path_transform_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(83:8) {#if typeof i[4] == 'string'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let if_block = /*i*/ ctx[10][4] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*i*/ ctx[10][4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	validate_slots('Fa', slots, []);
    	let { class: clazz = '' } = $$props;
    	let { id = '' } = $$props;
    	let { style = '' } = $$props;
    	let { icon } = $$props;
    	let { size = '' } = $$props;
    	let { color = '' } = $$props;
    	let { fw = false } = $$props;
    	let { pull = '' } = $$props;
    	let { scale = 1 } = $$props;
    	let { translateX = 0 } = $$props;
    	let { translateY = 0 } = $$props;
    	let { rotate = '' } = $$props;
    	let { flip = false } = $$props;
    	let { spin = false } = $$props;
    	let { pulse = false } = $$props;
    	let { primaryColor = '' } = $$props;
    	let { secondaryColor = '' } = $$props;
    	let { primaryOpacity = 1 } = $$props;
    	let { secondaryOpacity = 0.4 } = $$props;
    	let { swapOpacity = false } = $$props;
    	let i;
    	let s;
    	let transform;

    	const writable_props = [
    		'class',
    		'id',
    		'style',
    		'icon',
    		'size',
    		'color',
    		'fw',
    		'pull',
    		'scale',
    		'translateX',
    		'translateY',
    		'rotate',
    		'flip',
    		'spin',
    		'pulse',
    		'primaryColor',
    		'secondaryColor',
    		'primaryOpacity',
    		'secondaryOpacity',
    		'swapOpacity'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Fa> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('class' in $$props) $$invalidate(0, clazz = $$props.class);
    		if ('id' in $$props) $$invalidate(1, id = $$props.id);
    		if ('style' in $$props) $$invalidate(13, style = $$props.style);
    		if ('icon' in $$props) $$invalidate(14, icon = $$props.icon);
    		if ('size' in $$props) $$invalidate(15, size = $$props.size);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('fw' in $$props) $$invalidate(16, fw = $$props.fw);
    		if ('pull' in $$props) $$invalidate(17, pull = $$props.pull);
    		if ('scale' in $$props) $$invalidate(18, scale = $$props.scale);
    		if ('translateX' in $$props) $$invalidate(19, translateX = $$props.translateX);
    		if ('translateY' in $$props) $$invalidate(20, translateY = $$props.translateY);
    		if ('rotate' in $$props) $$invalidate(21, rotate = $$props.rotate);
    		if ('flip' in $$props) $$invalidate(22, flip = $$props.flip);
    		if ('spin' in $$props) $$invalidate(3, spin = $$props.spin);
    		if ('pulse' in $$props) $$invalidate(4, pulse = $$props.pulse);
    		if ('primaryColor' in $$props) $$invalidate(5, primaryColor = $$props.primaryColor);
    		if ('secondaryColor' in $$props) $$invalidate(6, secondaryColor = $$props.secondaryColor);
    		if ('primaryOpacity' in $$props) $$invalidate(7, primaryOpacity = $$props.primaryOpacity);
    		if ('secondaryOpacity' in $$props) $$invalidate(8, secondaryOpacity = $$props.secondaryOpacity);
    		if ('swapOpacity' in $$props) $$invalidate(9, swapOpacity = $$props.swapOpacity);
    	};

    	$$self.$capture_state = () => ({
    		getStyles,
    		getTransform,
    		clazz,
    		id,
    		style,
    		icon,
    		size,
    		color,
    		fw,
    		pull,
    		scale,
    		translateX,
    		translateY,
    		rotate,
    		flip,
    		spin,
    		pulse,
    		primaryColor,
    		secondaryColor,
    		primaryOpacity,
    		secondaryOpacity,
    		swapOpacity,
    		i,
    		s,
    		transform
    	});

    	$$self.$inject_state = $$props => {
    		if ('clazz' in $$props) $$invalidate(0, clazz = $$props.clazz);
    		if ('id' in $$props) $$invalidate(1, id = $$props.id);
    		if ('style' in $$props) $$invalidate(13, style = $$props.style);
    		if ('icon' in $$props) $$invalidate(14, icon = $$props.icon);
    		if ('size' in $$props) $$invalidate(15, size = $$props.size);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('fw' in $$props) $$invalidate(16, fw = $$props.fw);
    		if ('pull' in $$props) $$invalidate(17, pull = $$props.pull);
    		if ('scale' in $$props) $$invalidate(18, scale = $$props.scale);
    		if ('translateX' in $$props) $$invalidate(19, translateX = $$props.translateX);
    		if ('translateY' in $$props) $$invalidate(20, translateY = $$props.translateY);
    		if ('rotate' in $$props) $$invalidate(21, rotate = $$props.rotate);
    		if ('flip' in $$props) $$invalidate(22, flip = $$props.flip);
    		if ('spin' in $$props) $$invalidate(3, spin = $$props.spin);
    		if ('pulse' in $$props) $$invalidate(4, pulse = $$props.pulse);
    		if ('primaryColor' in $$props) $$invalidate(5, primaryColor = $$props.primaryColor);
    		if ('secondaryColor' in $$props) $$invalidate(6, secondaryColor = $$props.secondaryColor);
    		if ('primaryOpacity' in $$props) $$invalidate(7, primaryOpacity = $$props.primaryOpacity);
    		if ('secondaryOpacity' in $$props) $$invalidate(8, secondaryOpacity = $$props.secondaryOpacity);
    		if ('swapOpacity' in $$props) $$invalidate(9, swapOpacity = $$props.swapOpacity);
    		if ('i' in $$props) $$invalidate(10, i = $$props.i);
    		if ('s' in $$props) $$invalidate(11, s = $$props.s);
    		if ('transform' in $$props) $$invalidate(12, transform = $$props.transform);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*icon*/ 16384) {
    			$$invalidate(10, i = icon && icon.icon || [0, 0, '', [], '']);
    		}

    		if ($$self.$$.dirty & /*style, size, pull, fw*/ 237568) {
    			$$invalidate(11, s = getStyles(style, size, pull, fw));
    		}

    		if ($$self.$$.dirty & /*scale, translateX, translateY, rotate, flip*/ 8126464) {
    			$$invalidate(12, transform = getTransform(scale, translateX, translateY, rotate, flip, 512));
    		}
    	};

    	return [
    		clazz,
    		id,
    		color,
    		spin,
    		pulse,
    		primaryColor,
    		secondaryColor,
    		primaryOpacity,
    		secondaryOpacity,
    		swapOpacity,
    		i,
    		s,
    		transform,
    		style,
    		icon,
    		size,
    		fw,
    		pull,
    		scale,
    		translateX,
    		translateY,
    		rotate,
    		flip
    	];
    }

    class Fa extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			class: 0,
    			id: 1,
    			style: 13,
    			icon: 14,
    			size: 15,
    			color: 2,
    			fw: 16,
    			pull: 17,
    			scale: 18,
    			translateX: 19,
    			translateY: 20,
    			rotate: 21,
    			flip: 22,
    			spin: 3,
    			pulse: 4,
    			primaryColor: 5,
    			secondaryColor: 6,
    			primaryOpacity: 7,
    			secondaryOpacity: 8,
    			swapOpacity: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Fa",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*icon*/ ctx[14] === undefined && !('icon' in props)) {
    			console.warn("<Fa> was created without expected prop 'icon'");
    		}
    	}

    	get class() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fw() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fw(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pull() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pull(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scale() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scale(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get translateX() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set translateX(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get translateY() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set translateY(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rotate() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rotate(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get flip() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set flip(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get spin() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set spin(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pulse() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pulse(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get primaryColor() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set primaryColor(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get secondaryColor() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set secondaryColor(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get primaryOpacity() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set primaryOpacity(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get secondaryOpacity() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set secondaryOpacity(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get swapOpacity() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set swapOpacity(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Fa$1 = Fa;

    /*!
     * Font Awesome Free 6.1.1 by @fontawesome - https://fontawesome.com
     * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
     * Copyright 2022 Fonticons, Inc.
     */
    var faSun = {
      prefix: 'fas',
      iconName: 'sun',
      icon: [512, 512, [9728], "f185", "M256 159.1c-53.02 0-95.1 42.98-95.1 95.1S202.1 351.1 256 351.1s95.1-42.98 95.1-95.1S309 159.1 256 159.1zM509.3 347L446.1 255.1l63.15-91.01c6.332-9.125 1.104-21.74-9.826-23.72l-109-19.7l-19.7-109c-1.975-10.93-14.59-16.16-23.72-9.824L256 65.89L164.1 2.736c-9.125-6.332-21.74-1.107-23.72 9.824L121.6 121.6L12.56 141.3C1.633 143.2-3.596 155.9 2.736 164.1L65.89 256l-63.15 91.01c-6.332 9.125-1.105 21.74 9.824 23.72l109 19.7l19.7 109c1.975 10.93 14.59 16.16 23.72 9.824L256 446.1l91.01 63.15c9.127 6.334 21.75 1.107 23.72-9.822l19.7-109l109-19.7C510.4 368.8 515.6 356.1 509.3 347zM256 383.1c-70.69 0-127.1-57.31-127.1-127.1c0-70.69 57.31-127.1 127.1-127.1s127.1 57.3 127.1 127.1C383.1 326.7 326.7 383.1 256 383.1z"]
    };

    /* src/App.svelte generated by Svelte v3.47.0 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let strong0;
    	let button;
    	let fa;
    	let t1;
    	let div;
    	let h20;
    	let t2;
    	let strong1;
    	let t4;
    	let h21;
    	let t6;
    	let producttilegrid;
    	let current;
    	let mounted;
    	let dispose;
    	fa = new Fa$1({ props: { icon: faSun }, $$inline: true });
    	producttilegrid = new ProductTileGrid({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			strong0 = element("strong");
    			strong0.textContent = "BAPS-GUI";
    			button = element("button");
    			create_component(fa.$$.fragment);
    			t1 = space();
    			div = element("div");
    			h20 = element("h2");
    			t2 = text("A GUI FOR ");
    			strong1 = element("strong");
    			strong1.textContent = "r/BUILDAPCSALES";
    			t4 = space();
    			h21 = element("h2");
    			h21.textContent = "AVAILABLE PRODUCTS:";
    			t6 = space();
    			create_component(producttilegrid.$$.fragment);
    			add_location(strong0, file, 14, 20, 408);
    			add_location(button, file, 14, 45, 433);
    			attr_dev(h1, "class", "header svelte-449lbw");
    			add_location(h1, file, 14, 1, 389);
    			add_location(strong1, file, 16, 41, 570);
    			attr_dev(h20, "class", "header subheader svelte-449lbw");
    			add_location(h20, file, 16, 2, 531);
    			attr_dev(div, "class", "header subheader svelte-449lbw");
    			add_location(div, file, 15, 1, 498);
    			attr_dev(h21, "class", "header svelte-449lbw");
    			add_location(h21, file, 18, 1, 617);
    			attr_dev(main, "class", "svelte-449lbw");
    			add_location(main, file, 13, 0, 381);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(h1, strong0);
    			append_dev(h1, button);
    			mount_component(fa, button, null);
    			append_dev(main, t1);
    			append_dev(main, div);
    			append_dev(div, h20);
    			append_dev(h20, t2);
    			append_dev(h20, strong1);
    			append_dev(main, t4);
    			append_dev(main, h21);
    			append_dev(main, t6);
    			mount_component(producttilegrid, main, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", lightSwitch, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fa.$$.fragment, local);
    			transition_in(producttilegrid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fa.$$.fragment, local);
    			transition_out(producttilegrid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(fa);
    			destroy_component(producttilegrid);
    			mounted = false;
    			dispose();
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

    function lightSwitch() {
    	window.document.body.classList.toggle('dark-mode');
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { name } = $$props;
    	let { filters = [] } = $$props;
    	let dark = false;
    	const writable_props = ['name', 'filters'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('filters' in $$props) $$invalidate(1, filters = $$props.filters);
    	};

    	$$self.$capture_state = () => ({
    		ProductTile,
    		ProductTileGrid,
    		Fa: Fa$1,
    		faSun,
    		name,
    		filters,
    		dark,
    		lightSwitch
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('filters' in $$props) $$invalidate(1, filters = $$props.filters);
    		if ('dark' in $$props) dark = $$props.dark;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, filters];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 0, filters: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !('name' in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get filters() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filters(value) {
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
