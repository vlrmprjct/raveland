export const Util = {
	randomRange: (min, max) => {
		return min + Math.random() * (max - min);
	},
	randomInt: (min, max) => {
		return Math.floor(min + Math.random() * (max - min + 1));
	},
	map: (value, min1, max1, min2, max2) =>{
		return Util.lerp(Util.norm(value, min1, max1), min2, max2);
	},
	lerp: (value, min, max) => {
		return min + (max -min) * value;
	},
	norm: (value, min, max) => {
		return (value - min) / (max - min);
	},
	shuffle: (o) => {
		for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
	},
	clamp: (number, min, max) => Math.max(Math.min(number, max), min)
};
