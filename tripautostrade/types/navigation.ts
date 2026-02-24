import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ServiceArea } from '../data/serviceAreas';

export type RootStackParamList = {
  Home: undefined;
  Reviews: { area: ServiceArea };
  AddReview: { area: ServiceArea };
};

export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type ReviewScreenProps = NativeStackScreenProps<RootStackParamList, 'Reviews'>;
export type AddReviewScreenProps = NativeStackScreenProps<RootStackParamList, 'AddReview'>;
