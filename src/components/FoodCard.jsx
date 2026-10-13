import { Link } from 'react-router-dom';
import ReferenceImage from './ReferenceImage';
import { money } from '../utils';
export default function FoodCard({ food }) {
  return (
    <Link
      className="food-card"
      to={`/food/${food.id}`}
      aria-label={`View ${food.name}`}
    >
      <ReferenceImage region={food.bestsellerPhoto} alt={food.name} />
      <span className="bestseller-price">{money(food.bestsellerPrice)}</span>
    </Link>
  );
}
