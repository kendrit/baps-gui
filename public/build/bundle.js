
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
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
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

    class Tile {
        constructor(data, title, url, post_url) {
            this.data = data;
            this.title = title;
            this.url = url;
            this.post_url = post_url;
        }
    }

    /* src\ProductTile.svelte generated by Svelte v3.47.0 */
    const file$3 = "src\\ProductTile.svelte";

    // (21:30) 
    function create_if_block_3(ctx) {
    	let p;
    	let b;
    	let t2;
    	let a;
    	let t3_value = /*data*/ ctx[0].author + "";
    	let t3;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			p = element("p");
    			b = element("b");
    			b.textContent = `${/*daysAgo*/ ctx[4]} minute(s) ago`;
    			t2 = text(" by ");
    			a = element("a");
    			t3 = text(t3_value);
    			add_location(b, file$3, 21, 7, 949);
    			attr_dev(a, "href", a_href_value = "https://www.reddit.com/u/" + /*data*/ ctx[0].author + "/");
    			add_location(a, file$3, 21, 41, 983);
    			attr_dev(p, "class", "svelte-1kqcupt");
    			add_location(p, file$3, 21, 4, 946);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, b);
    			append_dev(p, t2);
    			append_dev(p, a);
    			append_dev(a, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t3_value !== (t3_value = /*data*/ ctx[0].author + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*data*/ 1 && a_href_value !== (a_href_value = "https://www.reddit.com/u/" + /*data*/ ctx[0].author + "/")) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(21:30) ",
    		ctx
    	});

    	return block;
    }

    // (19:28) 
    function create_if_block_2(ctx) {
    	let p;
    	let b;
    	let t2;
    	let a;
    	let t3_value = /*data*/ ctx[0].author + "";
    	let t3;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			p = element("p");
    			b = element("b");
    			b.textContent = `${/*hoursAgo*/ ctx[5]} hour(s) ago`;
    			t2 = text(" by ");
    			a = element("a");
    			t3 = text(t3_value);
    			add_location(b, file$3, 19, 7, 804);
    			attr_dev(a, "href", a_href_value = "https://www.reddit.com/u/" + /*data*/ ctx[0].author + "/");
    			add_location(a, file$3, 19, 40, 837);
    			attr_dev(p, "class", "svelte-1kqcupt");
    			add_location(p, file$3, 19, 4, 801);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, b);
    			append_dev(p, t2);
    			append_dev(p, a);
    			append_dev(a, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t3_value !== (t3_value = /*data*/ ctx[0].author + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*data*/ 1 && a_href_value !== (a_href_value = "https://www.reddit.com/u/" + /*data*/ ctx[0].author + "/")) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(19:28) ",
    		ctx
    	});

    	return block;
    }

    // (17:4) {#if daysAgo != 0}
    function create_if_block_1$1(ctx) {
    	let p;
    	let b;
    	let t2;
    	let a;
    	let t3_value = /*data*/ ctx[0].author + "";
    	let t3;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			p = element("p");
    			b = element("b");
    			b.textContent = `${/*daysAgo*/ ctx[4]} day(s) ago`;
    			t2 = text(" by ");
    			a = element("a");
    			t3 = text(t3_value);
    			add_location(b, file$3, 17, 7, 663);
    			attr_dev(a, "href", a_href_value = "https://www.reddit.com/u/" + /*data*/ ctx[0].author + "/");
    			add_location(a, file$3, 17, 38, 694);
    			attr_dev(p, "class", "svelte-1kqcupt");
    			add_location(p, file$3, 17, 4, 660);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, b);
    			append_dev(p, t2);
    			append_dev(p, a);
    			append_dev(a, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t3_value !== (t3_value = /*data*/ ctx[0].author + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*data*/ 1 && a_href_value !== (a_href_value = "https://www.reddit.com/u/" + /*data*/ ctx[0].author + "/")) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(17:4) {#if daysAgo != 0}",
    		ctx
    	});

    	return block;
    }

    // (31:4) {#if data.thumbnail != 'nsfw' && data.thumbnail != 'default'}
    function create_if_block$1(ctx) {
    	let img;
    	let img_src_value;
    	let img_alt_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*data*/ ctx[0].thumbnail)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*data*/ ctx[0].title + " thumbnail");
    			add_location(img, file$3, 31, 8, 1507);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && !src_url_equal(img.src, img_src_value = /*data*/ ctx[0].thumbnail)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*data*/ 1 && img_alt_value !== (img_alt_value = /*data*/ ctx[0].title + " thumbnail")) {
    				attr_dev(img, "alt", img_alt_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(31:4) {#if data.thumbnail != 'nsfw' && data.thumbnail != 'default'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let a1;
    	let t0;
    	let h2;
    	let t1;
    	let t2;
    	let a0;
    	let t3;
    	let a0_href_value;
    	let t4;
    	let div;
    	let h4;
    	let t5_value = (/*data*/ ctx[0] ? "www." + /*data*/ ctx[0].domain : "") + "";
    	let t5;
    	let t6;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t7;

    	function select_block_type(ctx, dirty) {
    		if (/*daysAgo*/ ctx[4] != 0) return create_if_block_1$1;
    		if (/*hoursAgo*/ ctx[5] != 0) return create_if_block_2;
    		if (/*minutesAgo*/ ctx[6] != 0) return create_if_block_3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type && current_block_type(ctx);
    	let if_block1 = /*data*/ ctx[0].thumbnail != 'nsfw' && /*data*/ ctx[0].thumbnail != 'default' && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			a1 = element("a");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			h2 = element("h2");
    			t1 = text(/*title*/ ctx[1]);
    			t2 = space();
    			a0 = element("a");
    			t3 = text("VISIT ORIGINAL POST");
    			t4 = space();
    			div = element("div");
    			h4 = element("h4");
    			t5 = text(t5_value);
    			t6 = space();
    			img = element("img");
    			t7 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(h2, "class", "svelte-1kqcupt");
    			add_location(h2, file$3, 23, 4, 1071);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "href", a0_href_value = "https://www.reddit.com" + /*post_url*/ ctx[3]);
    			add_location(a0, file$3, 24, 4, 1093);
    			add_location(h4, file$3, 27, 8, 1245);

    			if (!src_url_equal(img.src, img_src_value = /*data*/ ctx[0]
    			? "https://" + /*data*/ ctx[0].domain + "/favicon.ico"
    			: "")) attr_dev(img, "src", img_src_value);

    			attr_dev(img, "alt", img_alt_value = /*data*/ ctx[0]
    			? /*data*/ ctx[0].domain + " logo"
    			: "undefined logo");

    			add_location(img, file$3, 28, 8, 1298);
    			attr_dev(div, "class", "vendor");
    			attr_dev(div, "style", "display=inline;");
    			add_location(div, file$3, 25, 4, 1181);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "class", "product-tile-container svelte-1kqcupt");
    			attr_dev(a1, "href", /*url*/ ctx[2]);
    			add_location(a1, file$3, 15, 0, 569);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a1, anchor);
    			if (if_block0) if_block0.m(a1, null);
    			append_dev(a1, t0);
    			append_dev(a1, h2);
    			append_dev(h2, t1);
    			append_dev(a1, t2);
    			append_dev(a1, a0);
    			append_dev(a0, t3);
    			append_dev(a1, t4);
    			append_dev(a1, div);
    			append_dev(div, h4);
    			append_dev(h4, t5);
    			append_dev(div, t6);
    			append_dev(div, img);
    			append_dev(a1, t7);
    			if (if_block1) if_block1.m(a1, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (if_block0) if_block0.p(ctx, dirty);
    			if (dirty & /*title*/ 2) set_data_dev(t1, /*title*/ ctx[1]);

    			if (dirty & /*post_url*/ 8 && a0_href_value !== (a0_href_value = "https://www.reddit.com" + /*post_url*/ ctx[3])) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*data*/ 1 && t5_value !== (t5_value = (/*data*/ ctx[0] ? "www." + /*data*/ ctx[0].domain : "") + "")) set_data_dev(t5, t5_value);

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

    			if (/*data*/ ctx[0].thumbnail != 'nsfw' && /*data*/ ctx[0].thumbnail != 'default') {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(a1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*url*/ 4) {
    				attr_dev(a1, "href", /*url*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a1);

    			if (if_block0) {
    				if_block0.d();
    			}

    			if (if_block1) if_block1.d();
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
    	let bgImage;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ProductTile', slots, []);
    	let { tile = new Tile() } = $$props;
    	let { data = tile.data } = $$props;
    	let { title = tile.title } = $$props;
    	let { url = tile.url } = $$props;
    	let { post_url = tile.post_url } = $$props;
    	let now = new Date().getTime() / 1000;
    	let daysAgo = Math.round((now - data.created) / (60 * 60 * 24));
    	let hoursAgo = Math.round((now - data.created) / (60 * 60));
    	let minutesAgo = Math.round((now - data.created) / 60);
    	const writable_props = ['tile', 'data', 'title', 'url', 'post_url'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ProductTile> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('tile' in $$props) $$invalidate(7, tile = $$props.tile);
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('url' in $$props) $$invalidate(2, url = $$props.url);
    		if ('post_url' in $$props) $$invalidate(3, post_url = $$props.post_url);
    	};

    	$$self.$capture_state = () => ({
    		Tile,
    		tile,
    		data,
    		title,
    		url,
    		post_url,
    		now,
    		daysAgo,
    		hoursAgo,
    		minutesAgo,
    		bgImage
    	});

    	$$self.$inject_state = $$props => {
    		if ('tile' in $$props) $$invalidate(7, tile = $$props.tile);
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('url' in $$props) $$invalidate(2, url = $$props.url);
    		if ('post_url' in $$props) $$invalidate(3, post_url = $$props.post_url);
    		if ('now' in $$props) now = $$props.now;
    		if ('daysAgo' in $$props) $$invalidate(4, daysAgo = $$props.daysAgo);
    		if ('hoursAgo' in $$props) $$invalidate(5, hoursAgo = $$props.hoursAgo);
    		if ('minutesAgo' in $$props) $$invalidate(6, minutesAgo = $$props.minutesAgo);
    		if ('bgImage' in $$props) bgImage = $$props.bgImage;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data*/ 1) {
    			bgImage = `background-image: url("${data.thumbnail}");`;
    		}
    	};

    	return [data, title, url, post_url, daysAgo, hoursAgo, minutesAgo, tile];
    }

    class ProductTile extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			tile: 7,
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

    /* node_modules\svelte-fa\src\fa.svelte generated by Svelte v3.47.0 */
    const file$2 = "node_modules\\svelte-fa\\src\\fa.svelte";

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
    			add_location(g0, file$2, 81, 6, 1397);
    			attr_dev(g1, "transform", g1_transform_value = "translate(" + /*i*/ ctx[10][0] / 2 + " " + /*i*/ ctx[10][1] / 2 + ")");
    			attr_dev(g1, "transform-origin", g1_transform_origin_value = "" + (/*i*/ ctx[10][0] / 4 + " 0"));
    			add_location(g1, file$2, 77, 4, 1293);
    			attr_dev(svg, "id", svg_id_value = /*id*/ ctx[1] || undefined);
    			attr_dev(svg, "class", svg_class_value = "svelte-fa " + /*clazz*/ ctx[0] + " svelte-1cj2gr0");
    			attr_dev(svg, "style", /*s*/ ctx[11]);
    			attr_dev(svg, "viewBox", svg_viewBox_value = "0 0 " + /*i*/ ctx[10][0] + " " + /*i*/ ctx[10][1]);
    			attr_dev(svg, "aria-hidden", "true");
    			attr_dev(svg, "role", "img");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			toggle_class(svg, "pulse", /*pulse*/ ctx[4]);
    			toggle_class(svg, "spin", /*spin*/ ctx[3]);
    			add_location(svg, file$2, 66, 2, 1071);
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
    			add_location(path0, file$2, 90, 10, 1678);
    			attr_dev(path1, "d", path1_d_value = /*i*/ ctx[10][4][1]);
    			attr_dev(path1, "fill", path1_fill_value = /*primaryColor*/ ctx[5] || /*color*/ ctx[2] || 'currentColor');

    			attr_dev(path1, "fill-opacity", path1_fill_opacity_value = /*swapOpacity*/ ctx[9] != false
    			? /*secondaryOpacity*/ ctx[8]
    			: /*primaryOpacity*/ ctx[7]);

    			attr_dev(path1, "transform", path1_transform_value = "translate(" + /*i*/ ctx[10][0] / -2 + " " + /*i*/ ctx[10][1] / -2 + ")");
    			add_location(path1, file$2, 96, 10, 1935);
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
    			add_location(path, file$2, 83, 10, 1461);
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

    function create_fragment$2(ctx) {
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
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
    			id: create_fragment$2.name
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
    var faArrowsRotate = {
      prefix: 'fas',
      iconName: 'arrows-rotate',
      icon: [512, 512, [128472, "refresh", "sync"], "f021", "M464 16c-17.67 0-32 14.31-32 32v74.09C392.1 66.52 327.4 32 256 32C161.5 32 78.59 92.34 49.58 182.2c-5.438 16.81 3.797 34.88 20.61 40.28c16.89 5.5 34.88-3.812 40.3-20.59C130.9 138.5 189.4 96 256 96c50.5 0 96.26 24.55 124.4 64H336c-17.67 0-32 14.31-32 32s14.33 32 32 32h128c17.67 0 32-14.31 32-32V48C496 30.31 481.7 16 464 16zM441.8 289.6c-16.92-5.438-34.88 3.812-40.3 20.59C381.1 373.5 322.6 416 256 416c-50.5 0-96.25-24.55-124.4-64H176c17.67 0 32-14.31 32-32s-14.33-32-32-32h-128c-17.67 0-32 14.31-32 32v144c0 17.69 14.33 32 32 32s32-14.31 32-32v-74.09C119.9 445.5 184.6 480 255.1 480c94.45 0 177.4-60.34 206.4-150.2C467.9 313 458.6 294.1 441.8 289.6z"]
    };
    var faRefresh = faArrowsRotate;
    var faSun = {
      prefix: 'fas',
      iconName: 'sun',
      icon: [512, 512, [9728], "f185", "M256 159.1c-53.02 0-95.1 42.98-95.1 95.1S202.1 351.1 256 351.1s95.1-42.98 95.1-95.1S309 159.1 256 159.1zM509.3 347L446.1 255.1l63.15-91.01c6.332-9.125 1.104-21.74-9.826-23.72l-109-19.7l-19.7-109c-1.975-10.93-14.59-16.16-23.72-9.824L256 65.89L164.1 2.736c-9.125-6.332-21.74-1.107-23.72 9.824L121.6 121.6L12.56 141.3C1.633 143.2-3.596 155.9 2.736 164.1L65.89 256l-63.15 91.01c-6.332 9.125-1.105 21.74 9.824 23.72l109 19.7l19.7 109c1.975 10.93 14.59 16.16 23.72 9.824L256 446.1l91.01 63.15c9.127 6.334 21.75 1.107 23.72-9.822l19.7-109l109-19.7C510.4 368.8 515.6 356.1 509.3 347zM256 383.1c-70.69 0-127.1-57.31-127.1-127.1c0-70.69 57.31-127.1 127.1-127.1s127.1 57.3 127.1 127.1C383.1 326.7 326.7 383.1 256 383.1z"]
    };

    /* src\ProductTileGrid.svelte generated by Svelte v3.47.0 */

    const { Object: Object_1, console: console_1 } = globals;
    const file$1 = "src\\ProductTileGrid.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[28] = list[i];
    	return child_ctx;
    }

    // (105:4) {#each limits as question}
    function create_each_block_2(ctx) {
    	let option;
    	let t0_value = /*question*/ ctx[28].text + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = /*question*/ ctx[28].text;
    			option.value = option.__value;
    			add_location(option, file$1, 105, 8, 3605);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(105:4) {#each limits as question}",
    		ctx
    	});

    	return block;
    }

    // (129:4) {#each flairs as filter}
    function create_each_block_1(ctx) {
    	let label;
    	let t0_value = /*filter*/ ctx[25] + "";
    	let t0;
    	let t1;
    	let input;
    	let input_checked_value;
    	let t2;
    	let span;
    	let t3;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[16](/*filter*/ ctx[25]);
    	}

    	const block = {
    		c: function create() {
    			label = element("label");
    			t0 = text(t0_value);
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			span = element("span");
    			t3 = space();
    			attr_dev(input, "type", "checkbox");
    			input.checked = input_checked_value = /*filters*/ ctx[0][/*filter*/ ctx[25].toLowerCase()];
    			attr_dev(input, "class", "svelte-cet0b8");
    			add_location(input, file$1, 130, 8, 4484);
    			attr_dev(span, "class", "checkmark svelte-cet0b8");
    			add_location(span, file$1, 131, 8, 4595);
    			attr_dev(label, "class", "container svelte-cet0b8");
    			add_location(label, file$1, 129, 4, 4441);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, t0);
    			append_dev(label, t1);
    			append_dev(label, input);
    			append_dev(label, t2);
    			append_dev(label, span);
    			append_dev(label, t3);

    			if (!mounted) {
    				dispose = listen_dev(input, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*filters*/ 1 && input_checked_value !== (input_checked_value = /*filters*/ ctx[0][/*filter*/ ctx[25].toLowerCase()])) {
    				prop_dev(input, "checked", input_checked_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(129:4) {#each flairs as filter}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>      import ProductTile from './ProductTile.svelte'      import Tile from './tile.js'      import Fa from 'svelte-fa/src/fa.svelte';   import {faRefresh}
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
    		source: "(1:0) <script>      import ProductTile from './ProductTile.svelte'      import Tile from './tile.js'      import Fa from 'svelte-fa/src/fa.svelte';   import {faRefresh}",
    		ctx
    	});

    	return block;
    }

    // (139:0) {:then tilees}
    function create_then_block(ctx) {
    	let h2;
    	let t0_value = /*tilees*/ ctx[21].length + "";
    	let t0;
    	let t1;
    	let t2;
    	let div;
    	let current;
    	let each_value = /*tilees*/ ctx[21];
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
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = text(" AVAILABLE PRODUCTS:");
    			t2 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h2, "class", "header svelte-cet0b8");
    			add_location(h2, file$1, 139, 0, 4730);
    			attr_dev(div, "class", "grid-container svelte-cet0b8");
    			add_location(div, file$1, 140, 0, 4791);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*promise*/ 8) && t0_value !== (t0_value = /*tilees*/ ctx[21].length + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*promise*/ 8) {
    				each_value = /*tilees*/ ctx[21];
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
    						each_blocks[i].m(div, null);
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
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(139:0) {:then tilees}",
    		ctx
    	});

    	return block;
    }

    // (142:4) {#each tilees as tilee}
    function create_each_block(ctx) {
    	let producttile;
    	let current;

    	producttile = new ProductTile({
    			props: { tile: /*tilee*/ ctx[22], image: "" },
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
    		p: function update(ctx, dirty) {
    			const producttile_changes = {};
    			if (dirty & /*promise*/ 8) producttile_changes.tile = /*tilee*/ ctx[22];
    			producttile.$set(producttile_changes);
    		},
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
    		source: "(142:4) {#each tilees as tilee}",
    		ctx
    	});

    	return block;
    }

    // (137:16)       <h1>Loading...</h1>  {:then tilees}
    function create_pending_block(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Loading...";
    			add_location(h1, file$1, 137, 4, 4693);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(137:16)       <h1>Loading...</h1>  {:then tilees}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let select;
    	let t0;
    	let button0;
    	let b0;
    	let fa;
    	let t1;
    	let button1;
    	let b1;
    	let t3;
    	let button2;
    	let b2;
    	let t5;
    	let div0;
    	let label0;
    	let input0;
    	let t6;
    	let t7;
    	let label1;
    	let input1;
    	let t8;
    	let t9;
    	let label2;
    	let input2;
    	let t10;
    	let t11;
    	let div1;
    	let t12;
    	let br;
    	let t13;
    	let await_block_anchor;
    	let promise_1;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_2 = /*limits*/ ctx[4];
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	fa = new Fa$1({
    			props: { icon: faRefresh },
    			$$inline: true
    		});

    	let each_value_1 = /*flairs*/ ctx[5];
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
    		value: 21,
    		blocks: [,,,]
    	};

    	handle_promise(promise_1 = /*promise*/ ctx[3], info);

    	const block = {
    		c: function create() {
    			select = element("select");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t0 = space();
    			button0 = element("button");
    			b0 = element("b");
    			create_component(fa.$$.fragment);
    			t1 = space();
    			button1 = element("button");
    			b1 = element("b");
    			b1.textContent = "Enable All";
    			t3 = space();
    			button2 = element("button");
    			b2 = element("b");
    			b2.textContent = "Disable All";
    			t5 = space();
    			div0 = element("div");
    			label0 = element("label");
    			input0 = element("input");
    			t6 = text("\r\n        HOT");
    			t7 = space();
    			label1 = element("label");
    			input1 = element("input");
    			t8 = text("\r\n        TOP");
    			t9 = space();
    			label2 = element("label");
    			input2 = element("input");
    			t10 = text("\r\n        NEW");
    			t11 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t12 = space();
    			br = element("br");
    			t13 = space();
    			await_block_anchor = empty();
    			info.block.c();
    			if (/*limit*/ ctx[1] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[10].call(select));
    			add_location(select, file$1, 103, 0, 3504);
    			add_location(b0, file$1, 110, 27, 3736);
    			attr_dev(button0, "class", "svelte-cet0b8");
    			add_location(button0, file$1, 110, 0, 3709);
    			add_location(b1, file$1, 111, 29, 3805);
    			attr_dev(button1, "class", "svelte-cet0b8");
    			add_location(button1, file$1, 111, 0, 3776);
    			add_location(b2, file$1, 112, 30, 3863);
    			attr_dev(button2, "class", "svelte-cet0b8");
    			add_location(button2, file$1, 112, 0, 3833);
    			attr_dev(input0, "type", "radio");
    			attr_dev(input0, "name", "selectedQueryType");
    			input0.__value = 'hot';
    			input0.value = input0.__value;
    			/*$$binding_groups*/ ctx[13][0].push(input0);
    			add_location(input0, file$1, 115, 8, 3938);
    			attr_dev(label0, "class", "radio-btn");
    			add_location(label0, file$1, 114, 4, 3903);
    			attr_dev(input1, "type", "radio");
    			attr_dev(input1, "name", "selectedQueryType");
    			input1.__value = 'top';
    			input1.value = input1.__value;
    			/*$$binding_groups*/ ctx[13][0].push(input1);
    			add_location(input1, file$1, 119, 8, 4094);
    			attr_dev(label1, "class", "radio-btn");
    			add_location(label1, file$1, 118, 4, 4059);
    			attr_dev(input2, "type", "radio");
    			attr_dev(input2, "name", "selectedQueryType");
    			input2.__value = 'new';
    			input2.value = input2.__value;
    			/*$$binding_groups*/ ctx[13][0].push(input2);
    			add_location(input2, file$1, 123, 8, 4250);
    			attr_dev(label2, "class", "radio-btn");
    			add_location(label2, file$1, 122, 4, 4215);
    			add_location(div0, file$1, 113, 0, 3892);
    			attr_dev(div1, "class", "filter-container svelte-cet0b8");
    			add_location(div1, file$1, 127, 0, 4375);
    			add_location(br, file$1, 135, 0, 4665);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select, null);
    			}

    			select_option(select, /*limit*/ ctx[1]);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button0, anchor);
    			append_dev(button0, b0);
    			mount_component(fa, b0, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    			append_dev(button1, b1);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button2, anchor);
    			append_dev(button2, b2);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, label0);
    			append_dev(label0, input0);
    			input0.checked = input0.__value === /*selectedQueryType*/ ctx[2];
    			append_dev(label0, t6);
    			append_dev(div0, t7);
    			append_dev(div0, label1);
    			append_dev(label1, input1);
    			input1.checked = input1.__value === /*selectedQueryType*/ ctx[2];
    			append_dev(label1, t8);
    			append_dev(div0, t9);
    			append_dev(div0, label2);
    			append_dev(label2, input2);
    			input2.checked = input2.__value === /*selectedQueryType*/ ctx[2];
    			append_dev(label2, t10);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			insert_dev(target, t12, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[10]),
    					listen_dev(select, "change", /*change_handler*/ ctx[11], false, false, false),
    					listen_dev(button0, "click", /*refresh*/ ctx[6], false, false, false),
    					listen_dev(button1, "click", /*enableAll*/ ctx[8], false, false, false),
    					listen_dev(button2, "click", /*disableAll*/ ctx[7], false, false, false),
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[12]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[14]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[15])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*limits*/ 16) {
    				each_value_2 = /*limits*/ ctx[4];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty & /*limit, limits*/ 18) {
    				select_option(select, /*limit*/ ctx[1]);
    			}

    			if (dirty & /*selectedQueryType*/ 4) {
    				input0.checked = input0.__value === /*selectedQueryType*/ ctx[2];
    			}

    			if (dirty & /*selectedQueryType*/ 4) {
    				input1.checked = input1.__value === /*selectedQueryType*/ ctx[2];
    			}

    			if (dirty & /*selectedQueryType*/ 4) {
    				input2.checked = input2.__value === /*selectedQueryType*/ ctx[2];
    			}

    			if (dirty & /*filters, flairs, changeFilter*/ 545) {
    				each_value_1 = /*flairs*/ ctx[5];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			info.ctx = ctx;

    			if (dirty & /*promise*/ 8 && promise_1 !== (promise_1 = /*promise*/ ctx[3]) && handle_promise(promise_1, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fa.$$.fragment, local);
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fa.$$.fragment, local);

    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button0);
    			destroy_component(fa);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(button2);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div0);
    			/*$$binding_groups*/ ctx[13][0].splice(/*$$binding_groups*/ ctx[13][0].indexOf(input0), 1);
    			/*$$binding_groups*/ ctx[13][0].splice(/*$$binding_groups*/ ctx[13][0].indexOf(input1), 1);
    			/*$$binding_groups*/ ctx[13][0].splice(/*$$binding_groups*/ ctx[13][0].indexOf(input2), 1);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    			mounted = false;
    			run_all(dispose);
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
    	let filters = {};

    	let limits = [
    		{ id: 1, text: 10 },
    		{ id: 2, text: 25 },
    		{ id: 3, text: 50 },
    		{ id: 4, text: 100 },
    		{ id: 5, text: 250 },
    		{ id: 6, text: 500 }
    	];

    	let limit = 10;

    	let flairs = [
    		"Meta",
    		"CPU",
    		"Prebuilt",
    		"GPU",
    		"Misc",
    		"Mouse",
    		"Laptop",
    		"RAM",
    		"Fan",
    		"Controller",
    		"SSD-SATA",
    		"SSD-M2",
    		"Case",
    		"Printer",
    		"Monitor",
    		"Keyboard",
    		"Headphones",
    		"PSU",
    		"Cooler"
    	];

    	let tiles = [];
    	let selectedQueryType = 'top';
    	let promise = getTiles();

    	for (let i = 0; i < flairs.length; i++) {
    		filters[flairs[i].toLowerCase()] = true;
    	}

    	filters = filters;

    	function refresh() {
    		$$invalidate(3, promise = getTiles());
    	}

    	function generateUrl() {
    		let filterList = Object.keys(filters);
    		console.log(filterList);
    		let url = 'https://www.reddit.com/r/buildapcsales/' + selectedQueryType + '.json?limit=' + limit + '&t=month';

    		if (filters.length < 1) {
    			return url;
    		}

    		url += '&f=';

    		for (let i = 0; i < filters.length; i++) {
    			if (i + 1 === filters.length) {
    				url += 'flair_name%3A%22' + filters[i] + '%22';
    			} else {
    				url += 'flair_name%3A%22' + filters[i] + '%22%20OR';
    			}
    		}

    		console.log(url);
    		return url;
    	}

    	function disableAll() {
    		for (let i = 0; i < flairs.length; i++) {
    			$$invalidate(0, filters[flairs[i].toLowerCase()] = false, filters);
    		}

    		$$invalidate(0, filters);
    		refresh();
    	}

    	function enableAll() {
    		for (let i = 0; i < flairs.length; i++) {
    			$$invalidate(0, filters[flairs[i].toLowerCase()] = true, filters);
    		}

    		$$invalidate(0, filters);
    		refresh();
    	}

    	function filterPost(data) {
    		if (data.link_flair_css_class == null) {
    			return false;
    		}

    		for (let i = 0; i < flairs.length; i++) {
    			return filters[data.link_flair_css_class.toLowerCase()];
    		}

    		return true;
    	}

    	async function getTiles() {
    		console.log(selectedQueryType);
    		let url = generateUrl();

    		while (tiles.length > 0) {
    			tiles.pop();
    		}

    		await fetch(url).then(response => response.json()).then(body => {
    			for (let index = 0; index < body.data.children.length; index++) {
    				let data = body.data.children[index].data;
    				let _title = data.title;
    				let _url = data.url;
    				let _purl = data.permalink;

    				if (filterPost(data)) {
    					let newTile = new Tile(data, _title, _url, _purl);
    					tiles.push(newTile);
    				} else {
    					console.log(data.link_flair_css_class + " not allowed!");
    				}
    			}
    		});

    		tiles.sort((a, b) => a.data.created < b.data.created ? 1 : -1);
    		return tiles;
    	}

    	function changeFilter(filter) {
    		if (filters[filter.toLowerCase()]) {
    			$$invalidate(0, filters[filter.toLowerCase()] = false, filters);
    		} else {
    			$$invalidate(0, filters[filter.toLowerCase()] = true, filters);
    		}

    		$$invalidate(0, filters);
    		refresh();
    		return;
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<ProductTileGrid> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[]];

    	function select_change_handler() {
    		limit = select_value(this);
    		$$invalidate(1, limit);
    		$$invalidate(4, limits);
    	}

    	const change_handler = () => answer = '';

    	function input0_change_handler() {
    		selectedQueryType = this.__value;
    		$$invalidate(2, selectedQueryType);
    	}

    	function input1_change_handler() {
    		selectedQueryType = this.__value;
    		$$invalidate(2, selectedQueryType);
    	}

    	function input2_change_handler() {
    		selectedQueryType = this.__value;
    		$$invalidate(2, selectedQueryType);
    	}

    	const click_handler = filter => changeFilter(filter);

    	$$self.$capture_state = () => ({
    		ProductTile,
    		Tile,
    		Fa: Fa$1,
    		faRefresh,
    		filters,
    		limits,
    		limit,
    		flairs,
    		tiles,
    		selectedQueryType,
    		promise,
    		refresh,
    		generateUrl,
    		disableAll,
    		enableAll,
    		filterPost,
    		getTiles,
    		changeFilter
    	});

    	$$self.$inject_state = $$props => {
    		if ('filters' in $$props) $$invalidate(0, filters = $$props.filters);
    		if ('limits' in $$props) $$invalidate(4, limits = $$props.limits);
    		if ('limit' in $$props) $$invalidate(1, limit = $$props.limit);
    		if ('flairs' in $$props) $$invalidate(5, flairs = $$props.flairs);
    		if ('tiles' in $$props) tiles = $$props.tiles;
    		if ('selectedQueryType' in $$props) $$invalidate(2, selectedQueryType = $$props.selectedQueryType);
    		if ('promise' in $$props) $$invalidate(3, promise = $$props.promise);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		filters,
    		limit,
    		selectedQueryType,
    		promise,
    		limits,
    		flairs,
    		refresh,
    		disableAll,
    		enableAll,
    		changeFilter,
    		select_change_handler,
    		change_handler,
    		input0_change_handler,
    		$$binding_groups,
    		input1_change_handler,
    		input2_change_handler,
    		click_handler
    	];
    }

    class ProductTileGrid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProductTileGrid",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.47.0 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let strong0;
    	let button;
    	let fa;
    	let t1;
    	let div;
    	let h2;
    	let t2;
    	let a;
    	let strong1;
    	let t4;
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
    			h2 = element("h2");
    			t2 = text("A GUI FOR ");
    			a = element("a");
    			strong1 = element("strong");
    			strong1.textContent = "r/BUILDAPCSALES";
    			t4 = space();
    			create_component(producttilegrid.$$.fragment);
    			add_location(strong0, file, 13, 20, 395);
    			attr_dev(button, "class", "svelte-2qiona");
    			add_location(button, file, 13, 45, 420);
    			attr_dev(h1, "class", "header svelte-2qiona");
    			add_location(h1, file, 13, 1, 376);
    			add_location(strong1, file, 15, 89, 607);
    			attr_dev(a, "href", "https://www.reddit.com/r/buildapcsales");
    			add_location(a, file, 15, 40, 558);
    			attr_dev(h2, "class", "header subheader svelte-2qiona");
    			add_location(h2, file, 15, 1, 519);
    			attr_dev(div, "class", "header subheader svelte-2qiona");
    			add_location(div, file, 14, 1, 486);
    			attr_dev(main, "class", "svelte-2qiona");
    			add_location(main, file, 12, 0, 367);
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
    			append_dev(div, h2);
    			append_dev(h2, t2);
    			append_dev(h2, a);
    			append_dev(a, strong1);
    			append_dev(main, t4);
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
    	let dark = false;
    	const writable_props = ['name'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		ProductTile,
    		ProductTileGrid,
    		Fa: Fa$1,
    		faSun,
    		name,
    		dark,
    		lightSwitch
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('dark' in $$props) dark = $$props.dark;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 0 });

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
