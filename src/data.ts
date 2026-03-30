export interface Product {
  id: number;
  brand: string;
  size: string;
  price: number;
  cat: string;
  label: string;
  cars: string;
  image: string;
  fuel: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  rain: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  noise: number;
}

export const TIRE_IMAGE = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop';
export const TIRE_IMAGE_2 = 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=1000&auto=format&fit=crop';
export const TIRE_IMAGE_3 = 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=1000&auto=format&fit=crop';
export const TIRE_IMAGE_4 = 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?q=80&w=1000&auto=format&fit=crop';
export const FEATURED_TIRE = 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?q=80&w=1000&auto=format&fit=crop';

export const PRODUCTS: Product[] = [
  // ARO 13
  { id: 1, brand: 'Firestone', size: '155/70 R13', price: 210, cat: 'popular', label: 'Econômico', cars: 'Uno, Palio, Corsa, Clio', image: TIRE_IMAGE, fuel: 'E', rain: 'C', noise: 72 },
  { id: 2, brand: 'Pirelli', size: '155/70 R13', price: 240, cat: 'popular', label: 'Durabilidade', cars: 'Uno, Palio, Corsa, Clio', image: TIRE_IMAGE_2, fuel: 'F', rain: 'B', noise: 71 },
  { id: 3, brand: 'Goodyear', size: '165/70 R13', price: 230, cat: 'popular', label: 'Conforto', cars: 'Gol G4, Voyage, Uno Way', image: TIRE_IMAGE_3, fuel: 'E', rain: 'C', noise: 70 },
  { id: 4, brand: 'Dunlop', size: '165/70 R13', price: 220, cat: 'popular', label: 'Custo-Benefício', cars: 'Gol G4, Voyage', image: TIRE_IMAGE_4, fuel: 'E', rain: 'D', noise: 72 },
  { id: 5, brand: 'Michelin', size: '165/70 R13', price: 280, cat: 'popular', label: 'Premium', cars: 'Gol G4, Voyage, Uno Way', image: TIRE_IMAGE, fuel: 'C', rain: 'A', noise: 69 },
  
  // ARO 14
  { id: 6, brand: 'Pirelli', size: '175/70 R14', price: 280, cat: 'popular', label: 'Conforto', cars: 'Onix, HB20, Argo, Ka, Polo', image: TIRE_IMAGE_2, fuel: 'E', rain: 'B', noise: 71 },
  { id: 7, brand: 'Goodyear', size: '175/70 R14', price: 300, cat: 'popular', label: 'Eco', cars: 'Onix, HB20, Argo, Ka, Polo', image: TIRE_IMAGE_3, fuel: 'C', rain: 'C', noise: 70 },
  { id: 8, brand: 'Michelin', size: '175/70 R14', price: 330, cat: 'popular', label: 'Premium', cars: 'Onix, HB20, Argo, Ka, Polo', image: TIRE_IMAGE, fuel: 'B', rain: 'A', noise: 68 },
  { id: 9, brand: 'Bridgestone', size: '175/65 R14', price: 290, cat: 'popular', label: 'Eco', cars: 'Argo, Cronos, Polo, Ka', image: TIRE_IMAGE_4, fuel: 'C', rain: 'B', noise: 70 },
  { id: 10, brand: 'Hankook', size: '175/65 R14', price: 250, cat: 'popular', label: 'Custo-Benefício', cars: 'Argo, Cronos, Polo, Ka', image: TIRE_IMAGE_2, fuel: 'E', rain: 'C', noise: 71 },
  { id: 11, brand: 'Continental', size: '185/65 R14', price: 320, cat: 'popular', label: 'Alemão', cars: 'Onix Plus, HB20S, Virtus', image: TIRE_IMAGE_3, fuel: 'C', rain: 'B', noise: 71 },
  { id: 12, brand: 'Firestone', size: '185/65 R14', price: 240, cat: 'popular', label: 'Econômico', cars: 'Onix Plus, HB20S, Virtus', image: TIRE_IMAGE, fuel: 'E', rain: 'C', noise: 72 },
  { id: 13, brand: 'Kumho', size: '185/60 R14', price: 230, cat: 'popular', label: 'Custo-Benefício', cars: 'Gol, Fox, Etios', image: TIRE_IMAGE_4, fuel: 'E', rain: 'C', noise: 71 },
  { id: 14, brand: 'Itaro', size: '175/70 R14', price: 220, cat: 'popular', label: 'Econômico', cars: 'Onix, HB20, Argo', image: TIRE_IMAGE_2, fuel: 'F', rain: 'E', noise: 73 },
  
  // ARO 15
  { id: 15, brand: 'Michelin', size: '185/65 R15', price: 390, cat: 'passeio', label: 'Conforto Premium', cars: 'Corolla, Civic, Jetta', image: TIRE_IMAGE, fuel: 'B', rain: 'A', noise: 68 },
  { id: 16, brand: 'Pirelli', size: '185/65 R15', price: 360, cat: 'passeio', label: 'Conforto', cars: 'Corolla, Civic, Jetta', image: TIRE_IMAGE_2, fuel: 'C', rain: 'B', noise: 71 },
  { id: 17, brand: 'Bridgestone', size: '195/65 R15', price: 410, cat: 'passeio', label: 'Gran Turismo', cars: 'Corolla, Civic, Cruze', image: TIRE_IMAGE_3, fuel: 'C', rain: 'B', noise: 70 },
  { id: 18, brand: 'Goodyear', size: '195/65 R15', price: 390, cat: 'passeio', label: 'Eco', cars: 'Corolla, Civic, Cruze', image: TIRE_IMAGE_4, fuel: 'B', rain: 'C', noise: 69 },
  { id: 19, brand: 'Continental', size: '195/65 R15', price: 420, cat: 'passeio', label: 'Premium', cars: 'Jetta, Golf, Cruze', image: TIRE_IMAGE, fuel: 'B', rain: 'A', noise: 71 },
  { id: 20, brand: 'Dunlop', size: '195/60 R15', price: 340, cat: 'passeio', label: 'Sport', cars: 'Civic, Cruze, Cerato', image: TIRE_IMAGE_2, fuel: 'E', rain: 'B', noise: 70 },
  { id: 21, brand: 'Toyo', size: '205/65 R15', price: 360, cat: 'passeio', label: 'Touring', cars: 'Corolla, Civic, Elantra', image: TIRE_IMAGE_3, fuel: 'E', rain: 'C', noise: 71 },
  { id: 22, brand: 'Nexen', size: '195/55 R15', price: 300, cat: 'passeio', label: 'Econômico', cars: 'Polo, Fox, Gol', image: TIRE_IMAGE_4, fuel: 'E', rain: 'C', noise: 71 },
  { id: 23, brand: 'Hankook', size: '195/55 R15', price: 320, cat: 'passeio', label: 'Performance', cars: 'Polo, Fox, Gol', image: TIRE_IMAGE_2, fuel: 'C', rain: 'B', noise: 70 },
  { id: 24, brand: 'Yokohama', size: '195/60 R15', price: 380, cat: 'passeio', label: 'Japonês', cars: 'Civic, Corolla', image: TIRE_IMAGE_3, fuel: 'C', rain: 'B', noise: 70 },
  
  // ARO 16
  { id: 25, brand: 'Michelin', size: '205/55 R16', price: 570, cat: 'passeio', label: 'Top Premium', cars: 'Golf, Civic EXL, Tiguan', image: TIRE_IMAGE, fuel: 'B', rain: 'A', noise: 68 },
  { id: 26, brand: 'Pirelli', size: '205/55 R16', price: 520, cat: 'passeio', label: 'Premium', cars: 'Golf, Civic EXL, Tiguan', image: TIRE_IMAGE_2, fuel: 'C', rain: 'B', noise: 71 },
  { id: 27, brand: 'Bridgestone', size: '205/55 R16', price: 550, cat: 'passeio', label: 'Gran Turismo', cars: 'Golf, Civic EXL', image: TIRE_IMAGE_3, fuel: 'C', rain: 'B', noise: 70 },
  { id: 28, brand: 'Goodyear', size: '205/55 R16', price: 500, cat: 'passeio', label: 'Performance', cars: 'Golf, Focus, Jetta', image: TIRE_IMAGE_4, fuel: 'C', rain: 'B', noise: 70 },
  { id: 29, brand: 'Continental', size: '215/60 R16', price: 560, cat: 'passeio', label: 'Premium', cars: 'Corolla, Elantra, Cruze', image: TIRE_IMAGE, fuel: 'B', rain: 'A', noise: 71 },
  { id: 30, brand: 'Dunlop', size: '205/60 R16', price: 470, cat: 'passeio', label: 'Conforto', cars: 'EcoSport, Kicks, Tracker', image: TIRE_IMAGE_2, fuel: 'E', rain: 'B', noise: 70 },
  { id: 31, brand: 'Kumho', size: '205/60 R16', price: 430, cat: 'passeio', label: 'Econômico', cars: 'EcoSport, Kicks, Tracker', image: TIRE_IMAGE_3, fuel: 'E', rain: 'C', noise: 71 },
  { id: 32, brand: 'Xbri', size: '205/55 R16', price: 390, cat: 'passeio', label: 'Econômico', cars: 'Golf, Civic, Corolla', image: TIRE_IMAGE_4, fuel: 'F', rain: 'C', noise: 72 },
  
  // ARO 17
  { id: 33, brand: 'Michelin', size: '225/45 R17', price: 670, cat: 'passeio', label: 'Ultra Premium', cars: 'Cruze RS, Focus RS, A3', image: TIRE_IMAGE, fuel: 'C', rain: 'A', noise: 69 },
  { id: 34, brand: 'Pirelli', size: '225/45 R17', price: 590, cat: 'passeio', label: 'Premium', cars: 'Cruze RS, Focus RS', image: TIRE_IMAGE_2, fuel: 'E', rain: 'B', noise: 72 },
  { id: 35, brand: 'Bridgestone', size: '225/45 R17', price: 630, cat: 'esportivo', label: 'Sport', cars: 'Golf GTI, Civic Sport', image: TIRE_IMAGE_3, fuel: 'E', rain: 'B', noise: 71 },
  { id: 36, brand: 'Continental', size: '215/65 R17', price: 610, cat: 'suv', label: 'SUV Conforto', cars: 'Compass, Tracker, T-Cross', image: TIRE_IMAGE, fuel: 'C', rain: 'B', noise: 72 },
  { id: 37, brand: 'Goodyear', size: '215/65 R17', price: 590, cat: 'suv', label: 'SUV Eco', cars: 'Compass, Tracker, T-Cross', image: TIRE_IMAGE_4, fuel: 'C', rain: 'C', noise: 71 },
  { id: 38, brand: 'Michelin', size: '215/65 R17', price: 680, cat: 'suv', label: 'SUV Premium', cars: 'Compass, Tracker, Renegade', image: TIRE_IMAGE, fuel: 'B', rain: 'A', noise: 70 },
  { id: 39, brand: 'Pirelli', size: '225/65 R17', price: 630, cat: 'suv', label: 'SUV Eco', cars: 'Compass, Duster, Creta', image: TIRE_IMAGE_2, fuel: 'C', rain: 'B', noise: 72 },
  { id: 40, brand: 'Toyo', size: '225/65 R17', price: 600, cat: 'suv', label: 'Touring', cars: 'Compass, Duster, Creta', image: TIRE_IMAGE_3, fuel: 'E', rain: 'C', noise: 72 },
  { id: 41, brand: 'Goodyear', size: '265/65 R17', price: 950, cat: 'suv', label: 'Trilha', cars: 'Hilux, Frontier, Triton', image: TIRE_IMAGE_4, fuel: 'F', rain: 'E', noise: 74 },
  { id: 42, brand: 'BFGoodrich', size: '265/65 R17', price: 1150, cat: 'suv', label: 'Off-Road', cars: 'Hilux, Frontier, Triton', image: TIRE_IMAGE, fuel: 'G', rain: 'E', noise: 75 },
  { id: 43, brand: 'Yokohama', size: '225/65 R17', price: 720, cat: 'suv', label: 'Premium SUV', cars: 'Compass, RAV4', image: TIRE_IMAGE_2, fuel: 'C', rain: 'B', noise: 71 },
  
  // ARO 18
  { id: 44, brand: 'Michelin', size: '235/55 R18', price: 930, cat: 'suv', label: 'SUV Sport', cars: 'SW4, Palisade, Tucson', image: TIRE_IMAGE, fuel: 'C', rain: 'A', noise: 70 },
  { id: 45, brand: 'Pirelli', size: '235/55 R18', price: 840, cat: 'suv', label: 'SUV Eco', cars: 'SW4, Palisade, Tucson', image: TIRE_IMAGE_2, fuel: 'E', rain: 'B', noise: 72 },
  { id: 46, brand: 'Continental', size: '235/60 R18', price: 890, cat: 'suv', label: 'SUV Adventure', cars: 'Hilux, Amarok, Ranger', image: TIRE_IMAGE_3, fuel: 'E', rain: 'B', noise: 73 },
  { id: 47, brand: 'BFGoodrich', size: '265/60 R18', price: 1110, cat: 'suv', label: 'Off-Road', cars: 'Hilux, Amarok, Triton', image: TIRE_IMAGE_4, fuel: 'G', rain: 'E', noise: 75 },
  { id: 48, brand: 'Bridgestone', size: '225/40 R18', price: 840, cat: 'esportivo', label: 'Ultra Sport', cars: 'Golf GTI, Civic Sport, A3', image: TIRE_IMAGE, fuel: 'E', rain: 'B', noise: 72 },
  { id: 49, brand: 'Michelin', size: '225/40 R18', price: 970, cat: 'esportivo', label: 'Racing Street', cars: 'Golf GTI, Civic Sport', image: TIRE_IMAGE_2, fuel: 'D', rain: 'A', noise: 71 },
  { id: 50, brand: 'Pirelli', size: '235/40 R18', price: 1050, cat: 'esportivo', label: 'Superesportivo', cars: 'Golf R, A3 S-line', image: TIRE_IMAGE_3, fuel: 'E', rain: 'A', noise: 73 },
  
  // UTILITÁRIOS
  { id: 51, brand: 'Michelin', size: '195/75 R16', price: 490, cat: 'utilitario', label: 'Carga Leve', cars: 'Sprinter, Master, Transit', image: TIRE_IMAGE, fuel: 'D', rain: 'B', noise: 72 },
  { id: 52, brand: 'Pirelli', size: '215/75 R16', price: 520, cat: 'utilitario', label: 'Van', cars: 'Sprinter, Master, Ducato', image: TIRE_IMAGE_2, fuel: 'E', rain: 'C', noise: 73 },
  { id: 53, brand: 'Bridgestone', size: '235/65 R16', price: 570, cat: 'utilitario', label: 'Resistente', cars: 'S10, Frontier, Hilux Cab.', image: TIRE_IMAGE_3, fuel: 'E', rain: 'C', noise: 72 },
  { id: 54, brand: 'Goodyear', size: '215/65 R16', price: 500, cat: 'utilitario', label: 'Van', cars: 'Transit, Jumper, Daily', image: TIRE_IMAGE_4, fuel: 'E', rain: 'D', noise: 72 },
  { id: 55, brand: 'Pneu Express', size: '205/55 R16', price: 450, cat: 'esportivo', label: 'Edição Especial', cars: 'Golf, Civic, Corolla', image: FEATURED_TIRE, fuel: 'C', rain: 'B', noise: 70 },
];

export const CARS: Record<string, Record<string, string[]>> = {
  'Chevrolet': {
    'Onix 1.0 (2020+)': ['175/70 R14', '185/65 R14'],
    'Onix Plus (2020+)': ['185/65 R14', '195/65 R15'],
    'Cruze (2017+)': ['205/55 R16', '215/55 R17'],
    'Tracker (2021+)': ['215/65 R17'],
    'S10 (2016+)': ['235/65 R16', '265/65 R17'],
    'Spin (2012+)': ['185/65 R15', '195/65 R15'],
  },
  'Fiat': {
    'Argo 1.0': ['175/65 R14', '185/65 R14'],
    'Argo 1.3': ['195/55 R15', '205/55 R16'],
    'Cronos 1.3': ['185/65 R14', '175/65 R14'],
    'Uno (2010+)': ['165/70 R13', '175/70 R14'],
    'Palio (até 2017)': ['155/70 R13', '165/70 R13'],
    'Compass (2017+)': ['215/65 R17', '225/65 R17'],
    'Strada (2021+)': ['205/60 R16'],
  },
  'Volkswagen': {
    'Gol (G5/G6)': ['165/70 R13', '175/70 R14'],
    'Voyage (2016+)': ['175/70 R14', '185/65 R14'],
    'Polo (2018+)': ['185/65 R14', '195/55 R15'],
    'Virtus (2018+)': ['185/65 R14', '205/55 R16'],
    'Golf (2014+)': ['205/55 R16', '225/45 R17'],
    'T-Cross (2020+)': ['215/65 R17'],
    'Amarok (2011+)': ['235/60 R18', '265/60 R18'],
  },
  'Hyundai': {
    'HB20 1.0 (2012+)': ['175/70 R14', '185/65 R14'],
    'HB20S (2012+)': ['185/65 R14'],
    'Creta (2017+)': ['215/65 R17', '225/65 R17'],
    'Tucson (2016+)': ['235/55 R18'],
    'Elantra (2021+)': ['205/65 R15', '215/60 R16'],
  },
  'Toyota': {
    'Corolla (2014+)': ['195/65 R15', '205/65 R15', '215/60 R16'],
    'Yaris (2018+)': ['185/65 R15', '195/50 R16'],
    'Hilux (2016+)': ['265/65 R17', '265/60 R18'],
    'SW4 (2016+)': ['265/65 R17', '235/55 R18'],
  },
  'Renault': {
    'Kwid (2017+)': ['165/65 R14'],
    'Sandero (2017+)': ['175/65 R14', '185/65 R15'],
    'Logan (2014+)': ['175/65 R14', '185/65 R15'],
    'Duster (2012+)': ['215/65 R16', '225/65 R17'],
    'Oroch (2016+)': ['205/60 R16', '225/65 R17'],
  },
  'Ford': {
    'Ka 1.0 (2014+)': ['175/65 R14', '185/55 R15'],
    'EcoSport (2012+)': ['195/55 R16', '205/60 R16'],
    'Ranger (2013+)': ['265/65 R17', '265/60 R18'],
  },
  'Jeep': {
    'Renegade (2015+)': ['215/65 R17', '215/55 R18'],
    'Compass (2017+)': ['215/65 R17', '225/55 R18'],
    'Commander (2022+)': ['225/65 R17', '235/65 R17'],
  },
  'Honda': {
    'Fit (2015+)': ['185/55 R16', '195/50 R16'],
    'City (2015+)': ['185/55 R16', '195/55 R16'],
    'Civic (2017+)': ['215/55 R16', '225/45 R17'],
    'HR-V (2015+)': ['215/60 R16', '215/55 R17'],
    'CR-V (2018+)': ['235/55 R18'],
  },
  'Nissan': {
    'March (2012+)': ['175/65 R14', '185/55 R15'],
    'Versa (2021+)': ['185/65 R15', '205/55 R16'],
    'Kicks (2017+)': ['205/60 R16'],
    'Frontier (2017+)': ['265/65 R17', '265/60 R18'],
  },
  'Peugeot': {
    '208 (2013+)': ['185/65 R15', '195/55 R16'],
    '2008 (2020+)': ['215/60 R17'],
    'Expert (Van)': ['215/65 R16'],
  },
  'Citroën': {
    'C3 (2017+)': ['185/65 R15', '195/55 R16'],
    'C4 Cactus (2020+)': ['195/60 R16', '215/60 R17'],
    'Jumpy (Van)': ['215/65 R16'],
  },
  'Mitsubishi': {
    'L200 Triton (2020+)': ['265/60 R18', '265/65 R17'],
    'Outlander (2021+)': ['225/55 R18', '235/55 R18'],
    'Eclipse Cross (2022+)': ['225/50 R18'],
  },
  'Kia': {
    'Picanto (2012+)': ['175/65 R14'],
    'Cerato (2019+)': ['205/55 R16', '215/55 R17'],
    'Sportage (2022+)': ['235/55 R18'],
    'Carnival (2022+)': ['235/55 R18'],
  },
};

export const BRANDS = ['Michelin', 'Pirelli', 'Bridgestone', 'Goodyear', 'Continental', 'Dunlop', 'Hankook', 'Toyo', 'BFGoodrich', 'Firestone', 'Kumho', 'Nexen', 'Itaro', 'Yokohama', 'Xbri'];
