import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  LogOut,
  CarFront,
  Package,
  CircleDollarSign,
  X,
  ChevronDown,
  Check,
  LoaderCircle,
  ShieldCheck,
  Menu,
} from "lucide-react";
import { api, money } from "./api";
import CarArt from "./CarArt";
import { VehicleCard } from "./VehicleCard";

const categories = ["All vehicles", "Sports", "SUV", "Sedan", "Electric"];
const emptyVehicle = {
  make: "",
  model: "",
  category: "Sedan",
  price: "",
  quantity: 1,
};

function Brand() {
  return (
    <div className="brand">
      <span className="brand-symbol">
        m<span>.</span>
      </span>
      <span>
        motorhaus<span className="brand-dot">®</span>
      </span>
    </div>
  );
}

function Auth({ onLogin }) {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      onLogin(
        await api(`/auth/${register ? "register" : "login"}`, {
          method: "POST",
          body: JSON.stringify(fields),
        }),
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <section className="auth-story">
        <Brand />
        <div className="story-content">
          <div className="eyebrow light">
            EXCEPTIONAL CARS. EVERYDAY CLARITY.
          </div>
          <h1>
            A better way
            <br />
            to move forward.
          </h1>
          <p>
            Your next chapter starts with the right car.
            <br />
            Find it in a collection worth exploring.
          </p>
          <CarArt large color="#c9d5b3" />
          <div className="story-caption">
            <span>THE MOTORHAUS COLLECTION</span>
            <span>CURATED. CONNECTED. CONSIDERED.</span>
          </div>
        </div>
        <div className="story-footer">
          Good cars. Great possibilities.
          <ArrowUpRight size={19} />
        </div>
      </section>
      <section className="auth-form-wrap">
        <div className="auth-top">
          YOUR NEXT DRIVE, REIMAGINED <span>EST. 2026</span>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <div className="eyebrow">WELCOME TO MOTORHAUS</div>
          <h2>{register ? "Start your journey." : "Good to see you."}</h2>
          <p>
            {register
              ? "Create an account and explore the collection."
              : "Sign in to explore and manage your collection."}
          </p>
          <div className="auth-tabs">
            <button
              type="button"
              className={!register ? "active" : ""}
              onClick={() => {
                setRegister(false);
                setError("");
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={register ? "active" : ""}
              onClick={() => {
                setRegister(true);
                setError("");
              }}
            >
              Create account
            </button>
          </div>
          {register && (
            <label>
              Full name
              <input
                name="name"
                placeholder="Alex Morgan"
                required
                maxLength={80}
                autoComplete="name"
              />
            </label>
          )}
          <label>
            Email address
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              placeholder={
                register ? "At least 8 characters" : "Enter your password"
              }
              minLength={register ? 8 : 1}
              maxLength={128}
              required
              autoComplete={register ? "new-password" : "current-password"}
            />
          </label>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <button className="button primary auth-submit" disabled={busy}>
            {busy ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <>
                {register ? "Create account" : "Sign in"}
                <ArrowRight size={18} />
              </>
            )}
          </button>
          <div className="secure-note">
            <ShieldCheck size={15} /> Secure access to your dealership
          </div>
          <div className="demo-note">
            <strong>Taking a look around?</strong>
            <p>
              After running the demo seed, use <code>admin@example.com</code> /{" "}
              <code>AdminDemo123!</code> or <code>buyer@example.com</code> /{" "}
              <code>BuyerDemo123!</code>.
            </p>
          </div>
        </form>
        <div className="auth-bottom">
          © 2026 Motorhaus <span>Made for the road ahead.</span>
        </div>
      </section>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  const ref = useRef();
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return (
    <dialog
      className="modal"
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-title">
        <h2>{title}</h2>
        <button
          aria-label="Close dialog"
          className="icon-button"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("motorhaus-session"));
    } catch {
      return null;
    }
  });
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All vehicles");
  const [sort, setSort] = useState("featured");
  const [filters, setFilters] = useState(false);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [stockOnly, setStockOnly] = useState(false);
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const admin = session?.user.role === "admin";
  const request = (path, options = {}) =>
    api(path, { token: session?.access_token, ...options });
  function login(data) {
    sessionStorage.setItem("motorhaus-session", JSON.stringify(data));
    setSession(data);
  }
  function logout() {
    sessionStorage.removeItem("motorhaus-session");
    setSession(null);
    setVehicles([]);
    setModal(null);
    setError("");
    setToast("");
    setMobileNav(false);
    setSearch("");
    setCategory("All vehicles");
    setSort("featured");
    setFilters(false);
    setMin("");
    setMax("");
    setStockOnly(false);
    setFormError("");
  }
  async function load() {
    setLoading(true);
    setError("");
    try {
      setVehicles(await request("/vehicles"));
    } catch (error) {
      if (error.status === 401) logout();
      else setError(error.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (session) load();
  }, [session]);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timeout);
  }, [toast]);
  function openModal(type, vehicle = emptyVehicle) {
    setFormError("");
    setModal({ type, vehicle });
  }
  async function mutate(path, method, body, message) {
    setBusy(true);
    setFormError("");
    try {
      await request(path, {
        method,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      setModal(null);
      setToast(message);
      await load();
    } catch (error) {
      if (error.status === 401) logout();
      else setFormError(error.message);
    } finally {
      setBusy(false);
    }
  }
  if (!session) return <Auth onLogin={login} />;
  const invalidRange = min !== "" && max !== "" && Number(min) > Number(max);
  let visible = vehicles.filter(
    (v) =>
      (category === "All vehicles" || v.category === category) &&
      `${v.make} ${v.model} ${v.category}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (min === "" || Number(v.price) >= Number(min)) &&
      (max === "" || Number(v.price) <= Number(max)) &&
      (!stockOnly || v.quantity > 0),
  );
  if (sort === "price-low")
    visible.sort((a, b) => Number(a.price) - Number(b.price));
  if (sort === "price-high")
    visible.sort((a, b) => Number(b.price) - Number(a.price));
  if (sort === "name")
    visible.sort((a, b) =>
      `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`),
    );
  const total = vehicles.reduce((sum, car) => sum + car.quantity, 0);
  const valuation =
    vehicles.reduce(
      (sum, car) => sum + car.quantity * Math.round(Number(car.price) * 100),
      0,
    ) / 100;
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <Brand />
        <div className="sidebar-caption">YOUR WORKSPACE</div>
        <button
          className="nav-item selected"
          onClick={() => {
            setCategory("All vehicles");
            setMobileNav(false);
          }}
        >
          <LayoutGrid size={19} /> Inventory <span>{vehicles.length}</span>
        </button>
        <div className="sidebar-divider" />
        <div className="sidebar-caption">THE COLLECTION</div>
        {categories.slice(1).map((c) => (
          <button
            className={`nav-item category-nav ${category === c ? "chosen" : ""}`}
            key={c}
            onClick={() => {
              setCategory(c);
              setMobileNav(false);
            }}
          >
            <span className="nav-dot" />
            {c}
            <span>{vehicles.filter((v) => v.category === c).length}</span>
          </button>
        ))}
        <div className="sidebar-note">
          <div className="note-icon">
            <CarFront size={23} />
          </div>
          <h3>
            Every drive starts
            <br />
            with a possibility.
          </h3>
          <p>
            A considered collection.
            <br />
            All in one place.
          </p>
          <span>
            MOTORHAUS COLLECTION <ArrowUpRight size={15} />
          </span>
        </div>
        <div className="sidebar-user">
          <div className="avatar">
            {session.user.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <strong>{session.user.name}</strong>
            <span>{admin ? "Administrator" : "Member"}</span>
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="Toggle navigation"
            onClick={() => setMobileNav(!mobileNav)}
          >
            <Menu size={22} />
          </button>
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>Inventory</strong>
          </div>
          <div className="topbar-right">
            <span className="live-dot" /> Inventory connected{" "}
            <span className="topbar-separator" />
            <span className="role-pill">
              {admin ? "Admin workspace" : "Member workspace"}
            </span>
            <button className="button sign-out-button" onClick={logout}>
              <LogOut size={15} aria-hidden="true" />
              Sign out
            </button>
          </div>
        </header>
        <div className="page-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow">THE COLLECTION, AT A GLANCE</div>
              <h1>Your next great drive.</h1>
              <p>Exceptional vehicles. One beautifully simple inventory.</p>
            </div>
            {admin && (
              <button
                className="button primary"
                onClick={() => openModal("add")}
              >
                <Plus size={17} /> Add vehicle
              </button>
            )}
          </section>
          <section className="stats" aria-label="Inventory overview">
            <div className="stat">
              <span className="stat-label">
                Vehicles in collection <CarFront size={18} />
              </span>
              <div className="stat-value">
                {String(vehicles.length).padStart(2, "0")}
                <span>models</span>
              </div>
              <div className="stat-foot">A collection for every journey</div>
            </div>
            <div className="stat">
              <span className="stat-label">
                Ready for the road <Package size={18} />
              </span>
              <div className="stat-value">
                {String(total).padStart(2, "0")}
                <span>in stock</span>
              </div>
              <div className="stat-foot">
                <span className="small-dot" />
                Available to purchase today
              </div>
            </div>
            <div className="stat">
              <span className="stat-label">
                Total inventory value <CircleDollarSign size={18} />
              </span>
              <div className="stat-value valuation">{money(valuation)}</div>
              <div className="stat-foot">Across your entire collection</div>
            </div>
          </section>
          <section className="inventory-section">
            <div className="collection-heading">
              <h2>
                Explore the collection <span>{vehicles.length}</span>
              </h2>
              <span className="collection-subtitle">
                Find the one that moves you.
              </span>
            </div>
            <div className="toolbar">
              <div className="search-field">
                <Search size={18} />
                <input
                  aria-label="Search vehicles"
                  placeholder="Search make, model, or category…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
              <button
                className={`button filter-button ${filters ? "enabled" : ""}`}
                onClick={() => setFilters(!filters)}
                aria-expanded={filters}
              >
                <SlidersHorizontal size={16} />
                Filters
              </button>
              <div className="sort-control">
                <span>Sort by:</span>
                <select
                  aria-label="Sort vehicles"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                  <option value="name">Make A–Z</option>
                </select>
                <ChevronDown size={14} />
              </div>
            </div>
            {filters && (
              <div className="filter-panel">
                <label>
                  Minimum price ($)
                  <input
                    type="number"
                    min="0"
                    value={min}
                    onChange={(e) => setMin(e.target.value)}
                    placeholder="No minimum"
                  />
                </label>
                <label>
                  Maximum price ($)
                  <input
                    type="number"
                    min="0"
                    value={max}
                    onChange={(e) => setMax(e.target.value)}
                    placeholder="No maximum"
                  />
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={stockOnly}
                    onChange={(e) => setStockOnly(e.target.checked)}
                  />
                  In stock only
                </label>
                <button
                  className="text-button"
                  onClick={() => {
                    setMin("");
                    setMax("");
                    setStockOnly(false);
                  }}
                >
                  Reset filters
                </button>
                {invalidRange && (
                  <p role="alert" className="error">
                    Minimum price cannot exceed maximum price.
                  </p>
                )}
              </div>
            )}
            <div className="category-row">
              <div className="category-tabs">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={category === c ? "active" : ""}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <span className="result-count">
                {visible.length} vehicle{visible.length !== 1 ? "s" : ""}
              </span>
            </div>
            {error ? (
              <div className="empty-state" role="alert">
                <h3>Unable to load the collection</h3>
                <p>{error}</p>
                <button className="button primary" onClick={load}>
                  Try again
                </button>
              </div>
            ) : loading ? (
              <div className="loading-state">
                <LoaderCircle className="animate-spin" />
                Loading your collection…
              </div>
            ) : visible.length ? (
              <div className="vehicle-grid">
                {visible.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    admin={admin}
                    onPurchase={(v) => openModal("purchase", v)}
                    onEdit={(v) => openModal("edit", v)}
                    onDelete={(v) => openModal("delete", v)}
                    onRestock={(v) => openModal("restock", v)}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Search size={30} />
                <h3>A fresh road ahead.</h3>
                <p>
                  {vehicles.length
                    ? "No vehicles match these filters. Try a broader search."
                    : "Your collection is ready for its first vehicle."}
                </p>
                <button
                  className="button"
                  onClick={() => {
                    setSearch("");
                    setCategory("All vehicles");
                    setMin("");
                    setMax("");
                    setStockOnly(false);
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
          <footer className="page-footer">
            <span>© 2026 Motorhaus</span>
            <span>Good cars. Great possibilities.</span>
            <span>All prices in USD</span>
          </footer>
        </div>
      </main>
      {toast && (
        <div className="toast" role="status">
          <Check size={19} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <Modal
          title={
            {
              add: "Add to the collection",
              edit: "Edit vehicle",
              purchase: "Your next chapter.",
              delete: "Delete this vehicle?",
              restock: "Ready for more.",
            }[modal.type]
          }
          onClose={() => {
            if (!busy) setModal(null);
          }}
        >
          {["add", "edit"].includes(modal.type) ? (
            <form
              className="vehicle-form"
              onSubmit={(e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.currentTarget));
                data.quantity = Number(data.quantity);
                mutate(
                  `/vehicles${modal.type === "edit" ? `/${modal.vehicle.id}` : ""}`,
                  modal.type === "edit" ? "PUT" : "POST",
                  data,
                  modal.type === "edit"
                    ? "Vehicle updated."
                    : "Vehicle added to the collection.",
                );
              }}
            >
              <p className="modal-description">
                The details that make a great first impression.
              </p>
              <div className="form-grid">
                <label>
                  Make
                  <input
                    name="make"
                    defaultValue={modal.vehicle.make}
                    placeholder="Porsche"
                    required
                    maxLength={80}
                  />
                </label>
                <label>
                  Model
                  <input
                    name="model"
                    defaultValue={modal.vehicle.model}
                    placeholder="911 Carrera"
                    required
                    maxLength={120}
                  />
                </label>
                <label>
                  Category
                  <select name="category" defaultValue={modal.vehicle.category}>
                    {[
                      ...new Set([
                        ...categories.slice(1),
                        modal.vehicle.category,
                      ]),
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Price (USD)
                  <input
                    name="price"
                    type="number"
                    min="0"
                    max="1000000000"
                    step="0.01"
                    defaultValue={modal.vehicle.price}
                    required
                  />
                </label>
                <label>
                  Quantity in stock
                  <input
                    name="quantity"
                    type="number"
                    min="0"
                    max="1000000"
                    step="1"
                    defaultValue={modal.vehicle.quantity}
                    required
                  />
                </label>
              </div>
              {formError && (
                <p role="alert" className="error">
                  {formError}
                </p>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="button"
                  disabled={busy}
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button className="button primary" disabled={busy}>
                  {busy ? "Saving…" : "Save vehicle"}
                  <Check size={16} />
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const v = modal.vehicle;
                const root = `/vehicles/${v.id}`;
                if (modal.type === "purchase")
                  mutate(
                    root + "/purchase",
                    "POST",
                    null,
                    `${v.make} ${v.model} purchased. Inventory updated.`,
                  );
                if (modal.type === "delete")
                  mutate(
                    root,
                    "DELETE",
                    null,
                    "Vehicle removed from the collection.",
                  );
                if (modal.type === "restock")
                  mutate(
                    root + "/restock",
                    "POST",
                    {
                      quantity: Number(
                        new FormData(e.currentTarget).get("quantity"),
                      ),
                    },
                    "Stock updated. Ready for the road.",
                  );
              }}
            >
              <p className="modal-description">
                {modal.vehicle.make} {modal.vehicle.model}
              </p>
              {modal.type === "purchase" && (
                <div className="purchase-summary">
                  <CarArt category={modal.vehicle.category} />
                  <div>
                    <span>Purchase one vehicle</span>
                    <strong>{money(modal.vehicle.price)}</strong>
                  </div>
                  <p>This updates inventory only. No payment is collected.</p>
                </div>
              )}
              {modal.type === "delete" && (
                <p className="delete-copy">
                  This will permanently remove the vehicle and its stock record
                  from the collection.
                </p>
              )}
              {modal.type === "restock" && (
                <label>
                  Units to add
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    max="1000000"
                    step="1"
                    defaultValue="1"
                    required
                  />
                </label>
              )}
              {formError && (
                <p role="alert" className="error">
                  {formError}
                </p>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="button"
                  disabled={busy}
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button
                  className={`button ${modal.type === "delete" ? "danger" : "primary"}`}
                  disabled={busy}
                >
                  {busy
                    ? "Working…"
                    : {
                        purchase: "Confirm purchase",
                        delete: "Delete vehicle",
                        restock: "Add stock",
                      }[modal.type]}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
