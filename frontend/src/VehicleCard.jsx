import { ArrowUpRight, Pencil, Plus, Trash2 } from 'lucide-react';
import CarArt from './CarArt';
import { money } from './api';

const paints = ['#a1b09c', '#b6b6a8', '#728fa4', '#b8b3a6', '#a09b84', '#515d60', '#c9c5b9', '#9caab7'];
export function VehicleCard({ vehicle, admin = false, onPurchase, onEdit, onRestock, onDelete }) {
  const soldOut = vehicle.quantity === 0;
  return <article className={`vehicle-card ${soldOut ? 'sold-out' : ''}`}>
    <div className={`vehicle-visual visual-${vehicle.id % 4}`}><span className="category-badge">{vehicle.category}</span><span className="vehicle-number">N° {String(vehicle.id).padStart(3,'0')}</span><CarArt category={vehicle.category} color={paints[(vehicle.id - 1) % paints.length]}/><span className="illustration-caption">THE MOTORHAUS COLLECTION</span></div>
    <div className="vehicle-details"><div className="make-row"><span className="vehicle-make">{vehicle.make}</span><span className={`stock-badge ${soldOut ? 'empty' : vehicle.quantity <= 2 ? 'low' : ''}`}><i/>{soldOut ? 'Sold out' : `${vehicle.quantity} in stock`}</span></div><h3>{vehicle.model}</h3><div className="vehicle-spec">{vehicle.category} <span>·</span> Curated selection</div><div className="vehicle-bottom"><div className="price"><span>ASKING PRICE</span><strong>{money(vehicle.price)}</strong></div><button className="purchase-button" disabled={soldOut} onClick={() => onPurchase(vehicle)}>{soldOut ? 'Out of stock' : 'Purchase'}{!soldOut && <ArrowUpRight size={16}/>}</button></div>{admin && <div className="card-admin"><button onClick={() => onEdit(vehicle)} aria-label={`Edit ${vehicle.make} ${vehicle.model}`}><Pencil size={13}/>Edit</button><button onClick={() => onRestock(vehicle)} aria-label={`Restock ${vehicle.make} ${vehicle.model}`}><Plus size={14}/>Restock</button><button className="delete-button" onClick={() => onDelete(vehicle)} aria-label={`Delete ${vehicle.make} ${vehicle.model}`}><Trash2 size={13}/></button></div>}</div>
  </article>;
}
