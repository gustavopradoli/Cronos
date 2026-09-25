import logo from '../assets/cronos-logo.png';

type BrandMarkProps = {
  size?: 'small' | 'large';
};

export function BrandMark({ size = 'large' }: BrandMarkProps) {
  return <img className={`brand-logo brand-logo--${size}`} src={logo} alt="Cronos" />;
}