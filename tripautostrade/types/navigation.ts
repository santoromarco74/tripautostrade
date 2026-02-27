import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { ServiceArea } from '../data/serviceAreas';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type RecensioneEsistente = {
  id: string;
  stelle: number;
  testo: string;
  imageUrl?: string;
};

export type RootStackParamList = {
  Main: undefined;
  Reviews: { area: ServiceArea };
  AddReview: { area: ServiceArea; recensioneEsistente?: RecensioneEsistente };
};

export type TabParamList = {
  Esplora: undefined;
  Attività: undefined;
  Profilo: undefined;
};

export type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Esplora'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type ActivityScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Attività'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type ReviewScreenProps = NativeStackScreenProps<RootStackParamList, 'Reviews'>;
export type AddReviewScreenProps = NativeStackScreenProps<RootStackParamList, 'AddReview'>;
